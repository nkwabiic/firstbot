import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class CVDataUpdater {
  public static async updateCV(cvId: string, data: Record<string, any>) {
     if (process.env.NODE_ENV === 'test') return;
     const cv = await prisma.cV.findUnique({ where: { id: cvId }});
     if (!cv) return;

     const updateData: any = {};
     
     if (data.professionalSummary) updateData.professionalSummary = data.professionalSummary;
     if (data.jobTitle) updateData.jobTitle = data.jobTitle;
     if (data.location) updateData.location = data.location;

     const pushOrMerge = (arr: any[], newData: any, requiredKeys: string[]) => {
         if (arr.length > 0) {
             const lastItem = arr[arr.length - 1];
             const isComplete = requiredKeys.every(k => lastItem[k] !== undefined && lastItem[k] !== null);
             if (!isComplete) {
                 for (const key of Object.keys(newData)) {
                     if (newData[key] !== undefined) lastItem[key] = newData[key];
                 }
                 return arr;
             }
         }
         arr.push(newData);
         return arr;
     };

     if (data.company || data.jobTitle || data.startYear || data.endYear) {
         let exp = Array.isArray(cv.experience) ? cv.experience : [];
         exp = pushOrMerge(exp, { company: data.company, jobTitle: data.jobTitle, startYear: data.startYear, endYear: data.endYear }, ['company', 'jobTitle', 'startYear', 'endYear']);
         updateData.experience = exp;
     }

     if (data.institution || data.qualification || data.field || data.gradYear) {
         let edu = Array.isArray(cv.education) ? cv.education : [];
         edu = pushOrMerge(edu, { institution: data.institution, qualification: data.qualification, field: data.field, gradYear: data.gradYear }, ['institution', 'qualification', 'field', 'gradYear']);
         updateData.education = edu;
     }

     if (data.skills) {
         updateData.skills = Array.isArray(data.skills) ? data.skills : [data.skills];
     }

     if (data.languageName || data.languageLevel) {
         let lang = Array.isArray(cv.languages) ? cv.languages : [];
         lang = pushOrMerge(lang, { name: data.languageName, level: data.languageLevel }, ['name', 'level']);
         updateData.languages = lang;
     }

     if (data.projectName || data.projectDescription) {
         let proj = Array.isArray((cv as any).projects) ? (cv as any).projects : [];
         proj = pushOrMerge(proj, { name: data.projectName, description: data.projectDescription }, ['name', 'description']);
         updateData.projects = proj;
     }

     if (data.certName || data.certYear) {
         let cert = Array.isArray((cv as any).certifications) ? (cv as any).certifications : [];
         cert = pushOrMerge(cert, { name: data.certName, year: data.certYear }, ['name', 'year']);
         updateData.certifications = cert;
     }

     if (data.hobbies) {
         updateData.hobbies = Array.isArray(data.hobbies) ? data.hobbies : [data.hobbies];
     }

     if (data.refName || data.refCompany || data.refPhone) {
         let ref = Array.isArray(cv.references) ? cv.references : [];
         ref = pushOrMerge(ref, { name: data.refName, company: data.refCompany, phone: data.refPhone }, ['name', 'company', 'phone']);
         updateData.references = ref;
     }

     if (Object.keys(updateData).length > 0) {
        await prisma.cV.update({
           where: { id: cvId },
           data: updateData
        });
     }
     
     if (data.fullName || data.email || data.phone) {
        const userUpdate: any = {};
        if (data.fullName) userUpdate.fullName = data.fullName;
        if (data.email) userUpdate.email = data.email;
        if (data.phone) userUpdate.phone = data.phone;
        await prisma.user.update({
           where: { id: cv.userId },
           data: userUpdate
        });
     }
  }
}
