import { SectionDefinition, SectionId } from './types.js';

export const SECTION_REGISTRY: Record<SectionId, SectionDefinition> = {
  WELCOME: {
    id: 'WELCOME',
    order: 0,
    required: true,
    isMultiItem: false,
    name: { en: 'Welcome', sw: 'Karibu' },
    fields: [],
    introPrompt: { en: '', sw: '' }
  },
  LANGUAGE_SELECTION: {
    id: 'LANGUAGE_SELECTION',
    order: 1,
    required: true,
    isMultiItem: false,
    name: { en: 'Language Selection', sw: 'Chagua Lugha' },
    fields: [
      {
        id: 'lang',
        name: { en: 'Language', sw: 'Lugha' },
        required: true,
        prompt: {
          en: "Welcome to CareerBot 👋\nTafadhali chagua lugha yako / Please choose your language.\n1️⃣ Kiswahili\n2️⃣ English",
          sw: "Welcome to CareerBot 👋\nTafadhali chagua lugha yako / Please choose your language.\n1️⃣ Kiswahili\n2️⃣ English"
        }
      }
    ],
    introPrompt: { en: '', sw: '' }
  },
  PERSONAL_INFO: {
    id: 'PERSONAL_INFO',
    order: 2,
    required: true,
    isMultiItem: false,
    name: { en: 'Personal Information', sw: 'Taarifa Binafsi' },
    fields: [
      { id: 'fullName', name: { en: 'Full Name', sw: 'Jina Kamili' }, required: true, prompt: { en: "Let's begin with your personal information.\n\nMay I have your full name exactly as you would like it to appear on your CV?", sw: "Tuanze kwa kukusanya taarifa zako binafsi.\n\nTafadhali naomba unitajie jina lako kamili kama unavyopenda lionekane juu kwenye CV yako?" } },
      { id: 'email', name: { en: 'Email', sw: 'Barua Pepe' }, required: true, prompt: { en: "Thank you. Could you please share your professional email address? Employers will use this as their primary way to send you job offers and invitations.", sw: "Asante sana. Tafadhali andika barua pepe (email) yako ya kitaalamu. Waajiri watatumia barua pepe hii kukutumia ofa na mialiko ya kazi." } },
      { id: 'phone', name: { en: 'Phone', sw: 'Namba ya Simu' }, required: true, prompt: { en: "Perfect. What is your preferred phone number? This is crucial so recruiters can call you directly or reach out via WhatsApp for quick updates.", sw: "Safi sana. Namba gani ya simu ni bora zaidi kwa waajiri kukupigia simu au kukutafuta kwa urahisi zaidi kupitia WhatsApp?" } },
      { id: 'location', name: { en: 'Location', sw: 'Mahali Uliopo' }, required: true, prompt: { en: "Understood. Finally for this section, where are you currently located? Sharing your city and region (for example: Dar es Salaam, Tanzania) helps employers match you with local roles.", sw: "Nimeelewa. Mwisho kabisa kwa sehemu hii, kwa sasa unaishi wapi? Kutaja jiji na mkoa wako (kwa mfano: Dar es Salaam, Tanzania) kunawasaidia waajiri kupata wagombea wa karibu." } }
    ],
    introPrompt: {
      en: "Hello! It is a pleasure to meet you. I am your HR consultant, and I am excited to help you build a professional CV that stands out.\n\nLet's begin by gathering your basic personal information. This will ensure that potential employers can easily contact you.\n\n*Time:* ~1 minute\n\nWe will discuss:\n✓ Full Name\n✓ Email Address\n✓ Phone Number\n✓ Location",
      sw: "Habari yako! Ni furaha yangu kukutana nawe. Mimi ni mshauri wako wa rasilimali watu (HR), na nina furaha sana kukusaidia kuandaa wasifu (CV) wa kitaalamu utakaokusaidia kupata fursa nzuri.\n\nTuanze kwa kukusanya taarifa zako binafsi ili kurahisisha waajiri kuwasiliana nawe.\n\n*Muda:* ~Dakika 1\n\nTutaongelea:\n✓ Jina lako Kamili\n✓ Barua Pepe\n✓ Namba ya Simu\n✓ Mahali Unapoishi"
    }
  },
  SUMMARY: {
    id: 'SUMMARY',
    order: 3,
    required: true,
    isMultiItem: false,
    name: { en: 'Professional Summary', sw: 'Muhtasari wa Kitaaluma' },
    fields: [
      { id: 'professionalSummary', name: { en: 'Professional Summary', sw: 'Muhtasari wa Kitaaluma' }, required: true, prompt: { en: "Now, let's build your professional summary. This is your personal pitch to employers.\n\nCould you please describe your professional background, your key expertise, and what drives you in your career? Feel free to write naturally, and I will shape it into a highly polished professional statement.", sw: "Sasa, tuandae muhtasari wako wa kitaaluma. Huu ndio utambulisho mkuu unaowaonyesha waajiri sifa zako kwa sekunde chache.\n\nTafadhali andika kwa ufupi uzoefu wako, ujuzi wako mkuu, na nini hasa unacholenga katika kazi yako? Unaweza kuandika kwa kawaida, na mimi nitakusaidia kuiboresha kitaalamu kabisa." } }
    ],
    introPrompt: {
      en: "Excellent. We have your contact details. Next, let's craft a compelling Professional Summary.\n\n*Why it matters:* This brief section sits at the top of your CV and serves as your 'elevator pitch,' immediately showing employers your unique strengths and career focus.\n*Time:* ~2 minutes.",
      sw: "Safi sana. Tayari tuna taarifa zako za mawasiliano. Sasa, tuandike Muhtasari wa Kitaaluma unaovutia.\n\n*Kwanini ni muhimu:* Sehemu hii fupi inakuwa juu ya CV yako na inafanya kazi kama utambulisho wako mkuu, ikionyesha haraka nguvu zako na mwelekeo vya taaluma yako.\n*Muda:* ~Dakika 2."
    }
  },
  EXPERIENCE: {
    id: 'EXPERIENCE',
    order: 4,
    required: true,
    isMultiItem: true,
    name: { en: 'Work Experience', sw: 'Uzoefu wa Kazi' },
    fields: [
      { id: 'hasExperience', name: { en: 'Has Experience', sw: 'Ana Uzoefu' }, required: true, prompt: { en: "Do you have work experience? (Yes/No)", sw: "Je, una uzoefu wa kazi? (Ndio/Hapana)" } },
      { id: 'company', name: { en: 'Company', sw: 'Kampuni' }, required: true, prompt: { en: "Let's build your work experience details.\n\nTo begin, what is the name of the company or organization you worked for?", sw: "Tuanze kuweka maelezo ya uzoefu wako wa kazi.\n\nKwanza kabisa, ni jina la kampuni au shirika gani uliyofanyia kazi?" } },
      { id: 'jobTitle', name: { en: 'Job Title', sw: 'Cheo' }, required: true, prompt: { en: "What position or job title did you hold there?", sw: "Ulikuwa na cheo gani au ulifanya kazi katika nafasi ipi hapo?" } },
      { id: 'startYear', name: { en: 'Start Year', sw: 'Mwaka wa Kuanza' }, required: true, prompt: { en: "In which year did you start working in this role? (For example: 2021)", sw: "Ulianza lini kufanya kazi katika nafasi hii? Tafadhali taja mwaka (kwa mfano: 2021)." } },
      { id: 'endYear', name: { en: 'End Year', sw: 'Mwaka wa Kumaliza' }, required: true, prompt: { en: "When did you complete this role? Please specify the graduation/end year, or write 'Present' if you are currently still working there.", sw: "Ulikamilisha nafasi hii mwaka gani? Tafadhali taja mwaka wa kumaliza, au andika 'Sasa' kama bado unaendelea kufanya kazi hapo." } }
    ],
    introPrompt: {
      en: "Wonderful, your professional summary looks strong! Now let's discuss your Work Experience.\n\n*Why it matters:* This is typically the most critical part of a CV. It tells potential employers a clear story of your career journey, responsibilities, and achievements.\n*Time:* ~3 minutes.",
      sw: "Kazi nzuri sana, muhtasari wako wa kitaaluma unavutia sana! Sasa tuangazie Uzoefu wako wa Kazi.\n\n*Kwanini ni muhimu:* Hii ni sehemu muhimu zaidi kwenye CV yako. Inawaeleza waajiri kuhusu safari yako ya kazi, majukumu, na mafanikio yako.\n*Muda:* ~Dakika 3."
    }
  },
  EDUCATION: {
    id: 'EDUCATION',
    order: 5,
    required: true,
    isMultiItem: true,
    name: { en: 'Education', sw: 'Elimu' },
    fields: [
      { id: 'hasEducation', name: { en: 'Has Education', sw: 'Ana Elimu' }, required: true, prompt: { en: "Do you have formal education or degrees to add? (Yes/No)", sw: "Je, una elimu rasmi au vyeti vya kuongeza? (Ndio/Hapana)" } },
      { id: 'institution', name: { en: 'Institution', sw: 'Chuo/Shule' }, required: true, prompt: { en: "Let's capture your academic achievements.\n\nWhich school, college, or university did you attend for your studies?", sw: "Tuanze kukusanya historia ya elimu yako.\n\nNi shule au chuo gani ulichosoma masomo yako?" } },
      { id: 'qualification', name: { en: 'Qualification', sw: 'Aina ya Cheti' }, required: true, prompt: { en: "What qualification or degree did you receive? (For example: Bachelor's Degree, Diploma, Advanced Secondary Certificate).", sw: "Ulipata ngazi gani ya elimu au cheti gani cha masomo? (Kwa mfano: Shahada, Stashahada, au Cheti cha Kidato cha Sita)." } },
      { id: 'field', name: { en: 'Field of Study', sw: 'Fani' }, required: true, prompt: { en: "What was your main field of study or major? (For example: Computer Science, Economics, Business Administration).", sw: "Ulisomea fani gani au mchepuo gani? (Kwa mfano: Sayansi ya Kompyuta, Uchumi, au Usimamizi wa Biashara)." } },
      { id: 'gradYear', name: { en: 'Graduation Year', sw: 'Mwaka wa Kuhitimu' }, required: true, prompt: { en: "When did you complete this qualification? Please enter the graduation year (for example: 2020).", sw: "Ulihitimu au kukamilisha masomo haya mwaka gani? Tafadhali taja mwaka (kwa mfano: 2020)." } }
    ],
    introPrompt: {
      en: "Excellent. Your work experience has been captured beautifully! Next, let's detail your educational background.\n\n*Why it matters:* This section validates your technical foundation, academic qualifications, and commitment to learning.\n*Time:* ~2 minutes.",
      sw: "Vizuri sana. Uzoefu wako wa kazi umeingizwa vizuri sana! Sasa, tuangazie historia yako ya Elimu.\n\n*Kwanini ni muhimu:* Sehemu hii inadhihirisha misingi yako ya kitaaluma na vyeti ulivyopata.\n*Muda:* ~Dakika 2."
    }
  },
  SKILLS: {
    id: 'SKILLS',
    order: 6,
    required: true,
    isMultiItem: false,
    name: { en: 'Skills', sw: 'Ujuzi' },
    fields: [
      { id: 'skills', name: { en: 'Skills', sw: 'Ujuzi' }, required: true, prompt: { en: "Recruiters often scan CVs for specific keywords matching the job description.\n\nWhat are your top professional skills, technical tools, or core competencies? Please list them separated by commas (for example: Project Management, Python, Financial Analysis).", sw: "Waajiri mara nyingi hutafuta ujuzi maalum unaoendana na kazi.\n\nNi ujuzi gani mkuu au zana gani za kikazi unazozimudu vizuri zaidi? Tafadhali zitaje kwa kuziwekea koma (kwa mfano: Usimamizi wa Miradi, Python, Uchambuzi wa Fedha)." } }
    ],
    introPrompt: {
      en: "Perfect! Your education section is complete. Now, let's focus on your Professional Skills.\n\n*Why it matters:* Recruiters often scan CVs for specific keywords matching the job description. Listing your core skills clearly helps you pass the initial screening.\n*Time:* ~1 minute.",
      sw: "Hongera! Sehemu yako ya elimu imekamilika kikamilifu. Sasa, tuangazie Ujuzi na Stadi zako za Kazi.\n\n*Kwanini ni muhimu:* Mara nyingi waajiri hutafuta maneno muhimu (keywords) yanayoendana na kazi inayotangazwa. Kuainisha ujuzi wako kwa usahihi kunakuongezea nafasi.\n*Muda:* ~Dakika 1."
    }
  },
  LANGUAGES: {
    id: 'LANGUAGES',
    order: 7,
    required: true,
    isMultiItem: true,
    name: { en: 'Languages', sw: 'Lugha' },
    fields: [
      { id: 'languageName', name: { en: 'Language', sw: 'Lugha' }, required: true, prompt: { en: "Which language would you like to add to your CV? (For example: English, Swahili, French).", sw: "Ni lugha gani ungependa kuiongeza kwenye CV yako? (Kwa mfano: Kiswahili, Kiingereza, Kifaransa)." } },
      { id: 'languageLevel', name: { en: 'Level', sw: 'Kiwango' }, required: true, prompt: { en: "How would you describe your proficiency in this language? (For example: Native, Fluent, Intermediate, or Basic).", sw: "Unawezaje kueleza kiwango chako cha uelewa na uwezo wa kuongea lugha hii? (Kwa mfano: Lugha ya Mama, Fasaha, au Wastani)." } }
    ],
    introPrompt: {
      en: "Fantastic. Your skills list looks very professional. Next, let's document the Languages you speak.\n\n*Why it matters:* In today's global market, being multilingual is a major competitive advantage and opens up diverse job opportunities.\n*Time:* ~1 minute.",
      sw: "Safi sana. Orodha ya ujuzi wako inaonekana ya kitaalamu sana. Sasa, tuongeze Lugha unazozungumza.\n\n*Kwanini ni muhimu:* Katika soko la sasa la ajira, uwezo wa kuongea lugha zaidi ya moja ni sifa ya kipekee inayofungua milango ya fursa nyingi.\n*Muda:* ~Dakika 1."
    }
  },
  PROJECTS: {
    id: 'PROJECTS',
    order: 8,
    required: false,
    isMultiItem: true,
    name: { en: 'Projects', sw: 'Miradi' },
    fields: [
      { id: 'projectName', name: { en: 'Project Name', sw: 'Jina la Mradi' }, required: true, prompt: { en: "What is the name of this project? If you don't have any projects to add, feel free to say 'skip' to move to the next section.", sw: "Jina la mradi huu ni nini? Kama huna mradi wa kuongeza kwa sasa, unaweza kuandika 'ruka' ili tuendelee na sehemu inayofuata." } },
      { id: 'projectDescription', name: { en: 'Description', sw: 'Maelezo' }, required: true, prompt: { en: "Could you please briefly describe what this project was about, what you did, and what you achieved?", sw: "Tafadhali unaweza kueleza kwa ufupi mradi huu ulihusu nini, ulichokifanya, na matokeo gani uliyoyapata?" } }
    ],
    introPrompt: {
      en: "Excellent. We have captured your languages perfectly. Now, we have an optional section for Projects.\n\n*Why it matters:* Adding personal or professional projects is a powerful way to demonstrate hands-on experience, practical initiative, and problem-solving skills.\n*Time:* ~2 minutes.",
      sw: "Vizuri sana. Lugha zako zimeingizwa kikamilifu. Sasa, tuna sehemu ya hiari ya Miradi.\n\n*Kwanini ni muhimu:* Kuongeza miradi binafsi au ya kitaalamu ni njia nzuri ya kuonyesha uwezo wako wa kufanya mambo kwa vitendo na ubunifu wako.\n*Muda:* ~Dakika 2."
    }
  },
  CERTIFICATIONS: {
    id: 'CERTIFICATIONS',
    order: 9,
    required: false,
    isMultiItem: true,
    name: { en: 'Certifications', sw: 'Vyeti' },
    fields: [
      { id: 'certName', name: { en: 'Certification Name', sw: 'Jina la Cheti' }, required: true, prompt: { en: "What is the name of the certification or professional license you achieved? (Or say 'skip' if you don't have any).", sw: "Ni cheti gani cha kitaalamu au leseni ya ziada uliyopata? (Au andika 'ruka' kama huna)." } },
      { id: 'certYear', name: { en: 'Year', sw: 'Mwaka' }, required: true, prompt: { en: "In which year did you successfully earn this certification? (For example: 2022)", sw: "Ulikipata au kukamilisha mafunzo ya cheti hiki mwaka gani? (Kwa mfano: 2022)." } }
    ],
    introPrompt: {
      en: "Great job. Next, we have another optional section for Certifications.\n\n*Why it matters:* Having professional certifications or licenses proves your specialized training, dedication, and expertise to recruiters.\n*Time:* ~1 minute.",
      sw: "Kazi nzuri sana. Sehemu inayofuata ni ya hiari ya Vyeti vya Kitaalamu.\n\n*Kwanini ni muhimu:* Kuwa na vyeti vya mafunzo ya ziada au leseni za kitaaluma kunathibitisha utaalamu wako wa ziada kwa waajiri.\n*Muda:* ~Dakika 1."
    }
  },
  HOBBIES: {
    id: 'HOBBIES',
    order: 10,
    required: false,
    isMultiItem: false,
    name: { en: 'Hobbies', sw: 'Hobies/Mambo unayopenda' },
    fields: [
      { id: 'hobbies', name: { en: 'Hobbies', sw: 'Hobies' }, required: true, prompt: { en: "What hobbies, sports, or creative interests do you enjoy in your personal time? (Or say 'skip' to bypass).", sw: "Ni mambo gani au burudani gani unazopenda kufanya wakati wa mapumziko? (Au andika 'ruka' ili tuendelee)." } }
    ],
    introPrompt: {
      en: "Perfect. Let's look at another optional section: Hobbies and Personal Interests.\n\n*Why it matters:* Sharing 2-3 genuine interests gives employers a glimpse of your personality, soft skills, and cultural fit within their team.\n*Time:* ~1 minute.",
      sw: "Safi sana. Tuangalie sehemu nyingine ya hiari: Mambo unayopenda kufanya (Hobbies).\n\n*Kwanini ni muhimu:* Kushirikisha mambo 2-3 unayopenda kufanya kunawapa waajiri picha nzuri ya utu wako na namna unavyoweza kuendana na utamaduni wao wa kazi.\n*Muda:* ~Dakika 1."
    }
  },
  REFERENCES: {
    id: 'REFERENCES',
    order: 11,
    required: true,
    isMultiItem: true,
    name: { en: 'References', sw: 'Wadhamini' },
    fields: [
      { id: 'refName', name: { en: 'Name', sw: 'Jina' }, required: true, prompt: { en: "May I have the full name of your reference?", sw: "Tafadhali naomba unitajie jina kamili la mdhamini wako?" } },
      { id: 'refCompany', name: { en: 'Company', sw: 'Kampuni' }, required: true, prompt: { en: "Which company or organization is this reference associated with, and what is their job title?", sw: "Mdhamini huyu anafanya kazi katika kampuni au shirika gani, na ana cheo gani hapo?" } },
      { id: 'refPhone', name: { en: 'Phone', sw: 'Simu' }, required: true, prompt: { en: "What is their phone number or email address, so recruiters can verify your background if needed?", sw: "Namba yao ya simu au barua pepe yao ya kazi ni ipi ili waajiri waweze kuwasiliana nao?" } }
    ],
    introPrompt: {
      en: "Wonderful! We are now at our final section: References.\n\n*Why it matters:* Professional references provide potential employers with trusted industry contacts who can vouch for your character, skills, and work ethic.\n*Time:* ~2 minutes.",
      sw: "Vizuri sana! Sasa tumefika sehemu yetu ya mwisho kabisa: Wadhamini (References).\n\n*Kwanini ni muhimu:* Wadhamini wanawapa waajiri wako wapya watu wa kuaminika wa kuweza kuthibitisha utendaji wako wa kazi na tabia yako.\n*Muda:* ~Dakika 2."
    }
  },
  REVIEW: {
    id: 'REVIEW',
    order: 12,
    required: true,
    isMultiItem: false,
    name: { en: 'Review', sw: 'Uhakiki' },
    fields: [],
    introPrompt: {
      en: "Outstanding work! We have gathered all the necessary details for your professional CV. Let's do a quick final review together.",
      sw: "Kazi nzuri sana isiyo na mfano! Tumefanikiwa kukusanya taarifa zote muhimu kwa ajili ya CV yako ya kitaalamu. Sasa hebu tuhakiki kwa pamoja."
    }
  }
};

export const ORDERED_SECTIONS = Object.values(SECTION_REGISTRY).sort((a, b) => a.order - b.order);
