import { CV, User } from '@prisma/client';

export class CvPreviewService {
  buildPreview(user: User, cv: CV): string {
    let preview = '=================================\n';
    preview += 'YOUR CV PREVIEW\n';
    preview += '=================================\n\n';

    // Personal Information
    preview += 'Personal Information\n';
    if (user.fullName) preview += `Full Name: ${user.fullName}\n`;
    if (user.phone) preview += `Phone: ${user.phone}\n`;
    if (user.email) preview += `Email: ${user.email}\n`;
    preview += '\n';

    // Professional Summary
    if (cv.professionalSummary) {
      preview += '----------------------------------------\n';
      preview += 'PROFESSIONAL SUMMARY\n';
      preview += `${cv.professionalSummary}\n\n`;
    }

    // Work Experience
    if (cv.experience && Array.isArray(cv.experience) && cv.experience.length > 0) {
      preview += '----------------------------------------\n';
      preview += 'WORK EXPERIENCE\n\n';
      for (const exp of cv.experience as any[]) {
        if (exp.jobTitle) preview += `${exp.jobTitle.toUpperCase()}\n`;
        if (exp.company) preview += `${exp.company}\n`;
        const start =
          exp.startMonth && exp.startYear
            ? `${exp.startMonth} ${exp.startYear}`
            : exp.startYear || '';
        const end =
          exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : exp.endYear || '';
        if (start || end) preview += `${start} – ${end || 'Present'}\n`;
        if (exp.location) preview += `${exp.location}\n`;

        if (exp.responsibilities) {
          preview += `\n${exp.responsibilities}\n`;
        }
        if (exp.achievements) {
          preview += `${exp.achievements}\n`;
        }
        preview += '\n';
      }
    }

    // Education
    if (cv.education && Array.isArray(cv.education) && cv.education.length > 0) {
      preview += '----------------------------------------\n';
      preview += 'EDUCATION\n\n';
      for (const edu of cv.education as any[]) {
        if (edu.qualification && edu.field) {
          preview += `${edu.qualification} in ${edu.field}\n`;
        } else if (edu.qualification) {
          preview += `${edu.qualification}\n`;
        }
        if (edu.institution) preview += `${edu.institution}\n`;
        const start = edu.startYear || '';
        const end = edu.gradYear || '';
        if (start || end) preview += `${start} – ${end || 'Present'}\n`;
        if (edu.gpa) preview += `GPA: ${edu.gpa}\n`;
        preview += '\n';
      }
    }

    // Skills
    if (cv.skills) {
      preview += '----------------------------------------\n';
      preview += 'SKILLS\n\n';
      if (Array.isArray(cv.skills)) {
        preview += cv.skills.join('\n') + '\n';
      } else if (typeof cv.skills === 'string') {
        const skillsArray = cv.skills.split(',').map((s) => s.trim());
        preview += skillsArray.join('\n') + '\n';
      }
      preview += '\n';
    }

    // Languages
    if (cv.languages && Array.isArray(cv.languages) && cv.languages.length > 0) {
      preview += '----------------------------------------\n';
      preview += 'LANGUAGES\n\n';
      for (const lang of cv.languages as any[]) {
        preview += `${lang.language} — ${lang.level}\n`;
      }
      preview += '\n';
    }

    // References
    if (cv.references && Array.isArray(cv.references) && cv.references.length > 0) {
      preview += '----------------------------------------\n';
      preview += 'REFERENCES\n\n';
      for (const ref of cv.references as any[]) {
        if (ref.name) preview += `${ref.name}\n`;
        if (ref.position && ref.company) preview += `${ref.position}, ${ref.company}\n`;
        else if (ref.position) preview += `${ref.position}\n`;
        else if (ref.company) preview += `${ref.company}\n`;

        if (ref.phone) preview += `${ref.phone}\n`;
        if (ref.email) preview += `${ref.email}\n`;
        preview += '\n';
      }
    }

    preview += '=================================';
    return preview;
  }

  generateHtml(user: User, cv: Partial<CV> & Record<string, any>): string {
    const escape = (str: string | null | undefined) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 28px; color: #2c3e50; margin-bottom: 5px; text-transform: uppercase; }
    .contact-info { font-size: 14px; color: #7f8c8d; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { font-size: 18px; color: #2980b9; text-transform: uppercase; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
    .item { margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; }
    .title { font-weight: bold; font-size: 16px; color: #2c3e50; }
    .subtitle { font-style: italic; color: #7f8c8d; font-size: 14px; }
    .date { font-size: 14px; color: #95a5a6; }
    .location { font-size: 14px; color: #7f8c8d; }
    .description { margin-top: 5px; font-size: 14px; white-space: pre-wrap; }
    ul { margin-top: 5px; padding-left: 20px; font-size: 14px; }
    li { margin-bottom: 3px; }
    .skills-list, .languages-list { font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
    @page { size: A4; margin: 20mm; }
    @media print {
      body { padding: 0; max-width: none; }
      h2 { page-break-after: avoid; break-after: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escape(user.fullName || 'Professional CV')}</h1>
  <div class="contact-info">
    ${[user.email ? escape(user.email) : null, user.phone ? escape(user.phone) : null]
      .filter(Boolean)
      .join(' | ')}
  </div>

  ${
    cv.professionalSummary
      ? `
    <h2>Professional Summary</h2>
    <div class="description">${escape(cv.professionalSummary)}</div>
  `
      : ''
  }

  ${
    cv.experience && Array.isArray(cv.experience) && cv.experience.length > 0
      ? `
    <h2>Work Experience</h2>
    ${cv.experience
      .map(
        (exp: any) => `
      <div class="item">
        <div class="item-header">
          <span class="title">${escape(exp.jobTitle)}</span>
          <span class="date">${escape(exp.startMonth ? exp.startMonth + ' ' : '')}${escape(exp.startYear)} – ${escape(exp.endMonth ? exp.endMonth + ' ' : '')}${escape(exp.endYear || 'Present')}</span>
        </div>
        <div class="subtitle">${escape(exp.company)}${exp.location ? ', ' + escape(exp.location) : ''}</div>
        ${exp.responsibilities ? `<div class="description">${escape(exp.responsibilities)}</div>` : ''}
        ${exp.achievements ? `<div class="description">${escape(exp.achievements)}</div>` : ''}
      </div>
    `
      )
      .join('')}
  `
      : ''
  }
  
  ${
    cv.education && Array.isArray(cv.education) && cv.education.length > 0
      ? `
    <h2>Education</h2>
    ${cv.education
      .map(
        (edu: any) => `
      <div class="item">
        <div class="item-header">
          <span class="title">${escape(edu.qualification)}${edu.field ? ' in ' + escape(edu.field) : ''}</span>
          <span class="date">${escape(edu.startYear ? edu.startYear + ' – ' : '')}${escape(edu.gradYear || 'Present')}</span>
        </div>
        <div class="subtitle">${escape(edu.institution)}</div>
        ${edu.gpa ? `<div class="description">GPA: ${escape(edu.gpa)}</div>` : ''}
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  ${
    cv.projects && Array.isArray(cv.projects) && cv.projects.length > 0
      ? `
    <h2>Projects</h2>
    ${cv.projects
      .map(
        (proj: any) => `
      <div class="item">
        <div class="title">${escape(proj.name)}</div>
        ${proj.description ? `<div class="description">${escape(proj.description)}</div>` : ''}
        ${proj.technologies ? `<div class="description"><strong>Technologies:</strong> ${escape(Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies)}</div>` : ''}
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  ${
    cv.skills
      ? `
    <h2>Skills</h2>
    <div class="skills-list">
      ${Array.isArray(cv.skills) ? escape(cv.skills.join(', ')) : escape(String(cv.skills))}
    </div>
  `
      : ''
  }

  ${
    cv.languages && Array.isArray(cv.languages) && cv.languages.length > 0
      ? `
    <h2>Languages</h2>
    <div class="languages-list">
      ${cv.languages.map((lang: any) => `${escape(lang.language || lang.name)} (${escape(lang.level)})`).join(', ')}
    </div>
  `
      : ''
  }

  ${
    cv.references && Array.isArray(cv.references) && cv.references.length > 0
      ? `
    <h2>References</h2>
    ${cv.references
      .map(
        (ref: any) => `
      <div class="item">
        <div class="title">${escape(ref.name)}</div>
        <div class="subtitle">${escape(ref.position)}${ref.company ? ', ' + escape(ref.company) : ''}</div>
        <div class="description">
          ${[ref.phone ? escape(ref.phone) : null, ref.email ? escape(ref.email) : null]
            .filter(Boolean)
            .join(' | ')}
        </div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

</body>
</html>`;
  }
}
