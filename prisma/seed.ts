/* UnivOS seed — Aurora University demo tenant */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const HASH = bcrypt.hashSync("demo1234", 10);
const day = (offset: number, h = 9, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
};

async function main() {
  console.log("Seeding Aurora University …");

  // ---------- wipe (order matters) ----------
  const tables = [
    "eventRegistration", "campusEvent", "newsPost", "lead", "knowledgeChunk",
    "notification", "auditEvent", "complaint", "leaveRequest",
    "placementApplication", "jobPosting", "company",
    "outpass", "hostelAllocation", "hostelRoom", "hostel",
    "loan", "libraryItem", "application", "admissionCycle",
    "payment", "invoice", "feeStructure", "result", "examSchedule", "exam",
    "material", "assignmentSubmission", "assignment",
    "attendanceRecord", "attendanceSession", "enrollment", "timetableSlot",
    "section", "term", "course", "student", "guardianship",
    "facultyProfile", "program", "department", "user",
  ] as const;
  for (const t of tables) await (db as any)[t].deleteMany();

  // ---------- departments ----------
  const deptData = [
    { code: "CSE", name: "Computer Science & Engineering", slug: "computer-science", about: "Home to systems, AI, data science and security research with industry-embedded labs and a 4,000-core compute cluster.", hodName: "Prof. Vikram Rao" },
    { code: "ECE", name: "Electronics & Communication", slug: "electronics", about: "VLSI, embedded systems, photonics and 6G communication research with a state-of-the-art fabrication cleanroom.", hodName: "Prof. Sunita Desai" },
    { code: "ME", name: "Mechanical Engineering", slug: "mechanical", about: "Robotics, thermal sciences, advanced manufacturing and EV powertrain research in partnership with leading OEMs.", hodName: "Prof. Anil Joshi" },
    { code: "SOM", name: "School of Management", slug: "management", about: "Case-driven business education with specializations in analytics, fintech, marketing and operations strategy.", hodName: "Prof. Ritu Kapoor" },
    { code: "PHY", name: "Physical Sciences", slug: "physical-sciences", about: "Quantum materials, astrophysics and computational physics with observatory access and national lab collaborations.", hodName: "Prof. K. Srinivasan" },
    { code: "HUM", name: "Humanities & Social Sciences", slug: "humanities", about: "Literature, economics, psychology and public policy programs that shape reflective, articulate leaders.", hodName: "Prof. Maya Thomas" },
  ];
  const depts: Record<string, any> = {};
  for (const d of deptData) depts[d.code] = await db.department.create({ data: d });

  // ---------- programs ----------
  const programsData = [
    { slug: "btech-cse", name: "B.Tech Computer Science & Engineering", level: "UG", dept: "CSE", durationTerms: 8, totalCredits: 160, seats: 120, fee: 12500000, eligibility: "10+2 with PCM ≥ 75% and a valid AUCET/JEE score.", about: "A rigorous eight-semester program covering algorithms, systems, machine learning and large-scale software engineering, with a mandatory industry internship and capstone.", outcomes: ["Design and analyse scalable software systems", "Apply ML and data engineering to real problems", "Ship production software in agile teams", "Reason about security, ethics and reliability"] },
    { slug: "btech-ece", name: "B.Tech Electronics & Communication", level: "UG", dept: "ECE", durationTerms: 8, totalCredits: 160, seats: 90, fee: 11800000, eligibility: "10+2 with PCM ≥ 75% and a valid AUCET/JEE score.", about: "Semiconductors to signal processing — a hands-on journey through modern electronics, embedded systems and next-generation communication.", outcomes: ["Design analog and digital circuits", "Build embedded and IoT systems", "Model communication systems end to end"] },
    { slug: "btech-me", name: "B.Tech Mechanical Engineering", level: "UG", dept: "ME", durationTerms: 8, totalCredits: 160, seats: 90, fee: 11200000, eligibility: "10+2 with PCM ≥ 70% and a valid AUCET/JEE score.", about: "Classical mechanical engineering re-imagined for robotics, electric mobility and sustainable manufacturing.", outcomes: ["Design mechanical systems with CAD/CAE", "Prototype robots and EV subsystems", "Optimise manufacturing processes"] },
    { slug: "bba", name: "Bachelor of Business Administration", level: "UG", dept: "SOM", durationTerms: 6, totalCredits: 120, seats: 120, fee: 9500000, eligibility: "10+2 in any stream with ≥ 60%.", about: "A three-year immersion in management fundamentals, business analytics and entrepreneurship with live consulting projects.", outcomes: ["Analyse markets and financial statements", "Lead teams and communicate persuasively", "Launch and grow ventures"] },
    { slug: "mba", name: "Master of Business Administration", level: "PG", dept: "SOM", durationTerms: 4, totalCredits: 96, seats: 60, fee: 21000000, eligibility: "Bachelor's degree with ≥ 60% and CAT/XAT/AU-MAT score.", about: "A two-year, case-method MBA with tracks in analytics, fintech and operations, anchored by a semester-long industry practicum.", outcomes: ["Frame and solve strategic business problems", "Drive data-informed decisions", "Manage P&L with confidence"] },
    { slug: "mtech-ai", name: "M.Tech Artificial Intelligence", level: "PG", dept: "CSE", durationTerms: 4, totalCredits: 80, seats: 40, fee: 16500000, eligibility: "B.E/B.Tech in CS/IT/ECE with ≥ 65% and valid GATE score.", about: "Advanced study of deep learning, NLP, computer vision and MLOps, culminating in a published-quality thesis.", outcomes: ["Design and train state-of-the-art models", "Deploy and monitor ML in production", "Conduct independent AI research"] },
    { slug: "bsc-physics", name: "B.Sc (Hons.) Physics", level: "UG", dept: "PHY", durationTerms: 6, totalCredits: 120, seats: 60, fee: 6800000, eligibility: "10+2 with PCM ≥ 65%.", about: "A discovery-driven physics honours degree with early research immersion in quantum materials and astrophysics.", outcomes: ["Master classical and quantum physics", "Run experiments and analyse data rigorously", "Prepare for research careers"] },
    { slug: "ba-english", name: "BA (Hons.) English & Media Studies", level: "UG", dept: "HUM", durationTerms: 6, totalCredits: 120, seats: 60, fee: 5900000, eligibility: "10+2 in any stream with ≥ 55%.", about: "Literature, journalism and digital media in one interdisciplinary honours program with a newsroom-style media lab.", outcomes: ["Write and edit for diverse media", "Critically analyse texts and culture", "Produce multimedia stories"] },
  ];
  const programs: Record<string, any> = {};
  for (const p of programsData) {
    programs[p.slug] = await db.program.create({
      data: {
        slug: p.slug, name: p.name, level: p.level, departmentId: depts[p.dept].id,
        durationTerms: p.durationTerms, totalCredits: p.totalCredits, seats: p.seats,
        feePerTermMinor: p.fee, eligibility: p.eligibility, about: p.about,
        outcomes: JSON.stringify(p.outcomes),
      },
    });
  }

  // ---------- staff users ----------
  const staff = async (email: string, name: string, role: string, phone?: string) =>
    db.user.create({ data: { email, name, role, passwordHash: HASH, phone } });

  const admin = await staff("admin@aurora.edu", "Priya Raman", "ADMIN");
  const principal = await staff("principal@aurora.edu", "Dr. Meera Krishnan", "PRINCIPAL");
  const admissionOfficer = await staff("admissions@aurora.edu", "Arjun Nair", "ADMISSION_OFFICER");
  const accounts = await staff("accounts@aurora.edu", "Kavitha Iyer", "ACCOUNTS");
  const examCtrl = await staff("exams@aurora.edu", "Dr. Suresh Menon", "EXAM_CONTROLLER");
  const librarian = await staff("librarian@aurora.edu", "Lakshmi Pillai", "LIBRARIAN");
  const warden = await staff("warden@aurora.edu", "Rajesh Kumar", "WARDEN");
  const placementOfficer = await staff("placement@aurora.edu", "Divya Sharma", "PLACEMENT_OFFICER");

  // ---------- faculty ----------
  const facultyData = [
    { email: "faculty@aurora.edu", name: "Dr. Ananya Iyer", role: "FACULTY", dept: "CSE", designation: "Associate Professor", bio: "PhD (IISc). 12 years in distributed systems and databases; previously at a hyperscale cloud provider.", interests: "Distributed systems, Databases, Systems for ML" },
    { email: "hod@aurora.edu", name: "Prof. Vikram Rao", role: "HOD", dept: "CSE", designation: "Professor & Head", bio: "PhD (IIT Bombay). Leads the systems and security group; 60+ publications, 3 patents.", interests: "Operating systems, Security, Compilers" },
    { email: "n.gupta@aurora.edu", name: "Dr. Neha Gupta", role: "FACULTY", dept: "CSE", designation: "Assistant Professor", bio: "PhD (CMU). Machine learning researcher focused on trustworthy and efficient deep learning.", interests: "Machine learning, NLP, Fairness in AI" },
    { email: "s.reddy@aurora.edu", name: "Dr. Sanjay Reddy", role: "FACULTY", dept: "CSE", designation: "Assistant Professor", bio: "PhD (IIT Madras). Networks and cloud infrastructure; runs the campus SDN testbed.", interests: "Computer networks, Cloud computing, IoT" },
    { email: "p.menon@aurora.edu", name: "Dr. Priya Menon", role: "FACULTY", dept: "CSE", designation: "Assistant Professor", bio: "PhD (IIIT Hyderabad). Software engineering and program analysis; ex-startup CTO.", interests: "Software engineering, Program analysis, DevOps" },
    { email: "r.krishna@aurora.edu", name: "Dr. Rohan Krishna", role: "FACULTY", dept: "ECE", designation: "Associate Professor", bio: "PhD (IIT Delhi). VLSI and embedded ML accelerators.", interests: "VLSI, Edge AI, Embedded systems" },
    { email: "a.singh@aurora.edu", name: "Dr. Amrita Singh", role: "FACULTY", dept: "SOM", designation: "Professor", bio: "PhD (XLRI). Marketing analytics and consumer behaviour; consults for FMCG majors.", interests: "Marketing analytics, Consumer behaviour" },
    { email: "k.nair@aurora.edu", name: "Dr. Karthik Nair", role: "FACULTY", dept: "PHY", designation: "Associate Professor", bio: "PhD (TIFR). Quantum materials and computational condensed matter.", interests: "Quantum materials, Computational physics" },
  ];
  const facultyProfiles: Record<string, any> = {};
  for (const f of facultyData) {
    const u = await staff(f.email, f.name, f.role);
    facultyProfiles[f.email] = await db.facultyProfile.create({
      data: { userId: u.id, departmentId: depts[f.dept].id, designation: f.designation, bio: f.bio, interests: f.interests },
    });
  }

  // ---------- terms ----------
  const prevTermName = "Spring 2026";
  const curTermName = "Monsoon 2026";
  await db.term.create({ data: { name: prevTermName, startsAt: day(-205), endsAt: day(-55), isCurrent: false } });
  const curTerm = await db.term.create({ data: { name: curTermName, startsAt: day(-22), endsAt: day(145), isCurrent: true } });

  // ---------- courses (CSE sem 4 history + sem 5 current + a few others) ----------
  const courseDefs = [
    { code: "CS401", title: "Design & Analysis of Algorithms", credits: 4, semester: 4, type: "core", prog: "btech-cse" },
    { code: "CS402", title: "Discrete Mathematics", credits: 4, semester: 4, type: "core", prog: "btech-cse" },
    { code: "CS403", title: "Computer Architecture", credits: 3, semester: 4, type: "core", prog: "btech-cse" },
    { code: "CS404", title: "Object-Oriented Programming with Java", credits: 3, semester: 4, type: "core", prog: "btech-cse" },
    { code: "CS405", title: "Probability & Statistics", credits: 3, semester: 4, type: "core", prog: "btech-cse" },
    { code: "CS501", title: "Operating Systems", credits: 4, semester: 5, type: "core", prog: "btech-cse", about: "Processes, scheduling, memory management, file systems and virtualization with xv6-based labs." },
    { code: "CS502", title: "Database Management Systems", credits: 4, semester: 5, type: "core", prog: "btech-cse", about: "Relational modelling, SQL, indexing, transactions, recovery and an introduction to distributed data systems." },
    { code: "CS503", title: "Computer Networks", credits: 4, semester: 5, type: "core", prog: "btech-cse", about: "TCP/IP stack, routing, congestion control, application protocols and software-defined networking." },
    { code: "CS504", title: "Machine Learning", credits: 4, semester: 5, type: "core", prog: "btech-cse", about: "Supervised and unsupervised learning, neural networks, evaluation methodology and responsible ML practice." },
    { code: "CS505", title: "Software Engineering Lab", credits: 2, semester: 5, type: "lab", prog: "btech-cse", about: "Team project through the full SDLC — requirements, CI/CD, code review, testing and a live demo day." },
    { code: "EC301", title: "Digital Signal Processing", credits: 4, semester: 3, type: "core", prog: "btech-ece" },
    { code: "EC302", title: "Microcontrollers & Embedded C", credits: 3, semester: 3, type: "core", prog: "btech-ece" },
    { code: "BB201", title: "Principles of Marketing", credits: 3, semester: 3, type: "core", prog: "bba" },
    { code: "BB202", title: "Business Statistics", credits: 3, semester: 3, type: "core", prog: "bba" },
    { code: "AI501", title: "Deep Learning", credits: 4, semester: 1, type: "core", prog: "mtech-ai" },
  ];
  const courses: Record<string, any> = {};
  for (const c of courseDefs) {
    courses[c.code] = await db.course.create({
      data: { code: c.code, title: c.title, credits: c.credits, semester: c.semester, type: c.type, programId: programs[c.prog].id, about: (c as any).about ?? "" },
    });
  }

  // ---------- students ----------
  const firstNames = ["Aditi", "Rohan", "Sneha", "Karan", "Ishita", "Varun", "Pooja", "Nikhil", "Tanvi", "Aman", "Riya", "Siddharth", "Ankita", "Dev", "Meghna", "Harsh", "Zara", "Kabir", "Naina", "Yash", "Fatima", "Arnav", "Shreya"];
  const lastNames = ["Sharma", "Patel", "Reddy", "Khan", "Mehta", "Das", "Singh", "Joshi", "Chopra", "Bose", "Kulkarni", "Mishra", "Pillai", "Agarwal", "Rao", "Fernandes", "Bhat", "Malhotra", "Sen", "Kaur", "Sheikh", "Tiwari", "Nanda"];

  const demoStudentUser = await db.user.create({ data: { email: "student@aurora.edu", name: "Rahul Verma", role: "STUDENT", passwordHash: HASH, phone: "+91 98450 12345" } });
  const rahul = await db.student.create({
    data: { userId: demoStudentUser.id, programId: programs["btech-cse"].id, rollNo: "AU24CS001", batchYear: 2024, semester: 5, category: "General", hostelResident: true },
  });

  const cseStudents: any[] = [rahul];
  for (let i = 0; i < 14; i++) {
    const name = `${firstNames[i]} ${lastNames[i]}`;
    const u = await db.user.create({ data: { email: `au24cs${String(i + 2).padStart(3, "0")}@aurora.edu`, name, role: "STUDENT", passwordHash: HASH } });
    cseStudents.push(await db.student.create({
      data: { userId: u.id, programId: programs["btech-cse"].id, rollNo: `AU24CS${String(i + 2).padStart(3, "0")}`, batchYear: 2024, semester: 5, category: i % 5 === 0 ? "OBC" : i % 7 === 0 ? "EWS" : "General", hostelResident: i % 3 !== 0 },
    }));
  }
  // a few students in other programs
  const otherStudents: any[] = [];
  const otherProgs = ["btech-ece", "bba", "bsc-physics", "mba", "btech-me", "ba-english", "mtech-ai", "btech-ece"];
  for (let i = 0; i < 8; i++) {
    const name = `${firstNames[i + 15] ?? firstNames[i]} ${lastNames[i + 15] ?? lastNames[i]}`;
    const u = await db.user.create({ data: { email: `au25x${String(i + 1).padStart(3, "0")}@aurora.edu`, name, role: "STUDENT", passwordHash: HASH } });
    otherStudents.push(await db.student.create({
      data: { userId: u.id, programId: programs[otherProgs[i]].id, rollNo: `AU25X${String(i + 1).padStart(3, "0")}`, batchYear: 2025, semester: 3, hostelResident: i % 2 === 0 },
    }));
  }

  // parent linked to Rahul
  const parent = await db.user.create({ data: { email: "parent@aurora.edu", name: "Suresh Verma", role: "PARENT", passwordHash: HASH, phone: "+91 98111 22334" } });
  await db.guardianship.create({ data: { guardianId: parent.id, studentId: rahul.id, relationship: "Father" } });

  // ---------- sections + timetable (current term, CSE sem 5) ----------
  const sectionDefs = [
    { code: "CS501", fac: "hod@aurora.edu", room: "LH-204", slots: [[1, 540, 600], [3, 540, 600]] },
    { code: "CS502", fac: "faculty@aurora.edu", room: "LH-105", slots: [[1, 660, 720], [4, 600, 660]] },
    { code: "CS503", fac: "s.reddy@aurora.edu", room: "LH-301", slots: [[2, 540, 600], [4, 540, 600]] },
    { code: "CS504", fac: "n.gupta@aurora.edu", room: "LH-108", slots: [[2, 660, 720], [5, 540, 600]] },
    { code: "CS505", fac: "p.menon@aurora.edu", room: "Lab-3", slots: [[5, 840, 960]] },
  ];
  const sections: Record<string, any> = {};
  for (const s of sectionDefs) {
    const sec = await db.section.create({
      data: { courseId: courses[s.code].id, termId: curTerm.id, facultyId: facultyProfiles[s.fac].id, room: s.room, capacity: 60 },
    });
    sections[s.code] = sec;
    for (const [dow, st, en] of s.slots) {
      await db.timetableSlot.create({ data: { sectionId: sec.id, dayOfWeek: dow, startMin: st, endMin: en, room: s.room } });
    }
    for (const st of cseStudents) {
      await db.enrollment.create({ data: { studentId: st.id, sectionId: sec.id } });
    }
  }

  // ---------- attendance history (last ~3 weeks) ----------
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const s of sectionDefs) {
    const sec = sections[s.code];
    for (let d = 21; d >= 1; d--) {
      const date = day(-d);
      const dow = date.getDay(); // 0 Sun..6 Sat
      if (!s.slots.some(([sd]) => sd === dow)) continue;
      const session = await db.attendanceSession.create({
        data: { sectionId: sec.id, date, method: "qr", code: `AU-${s.code}-${d}`, status: "closed" },
      });
      for (let i = 0; i < cseStudents.length; i++) {
        const st = cseStudents[i];
        // Rahul ~88%; students 11-14 chronic (~55-65%); others ~75-95%
        const p = st.id === rahul.id ? 0.88 : i >= 11 ? 0.58 : 0.72 + (i % 5) * 0.05;
        const present = rnd() < p;
        await db.attendanceRecord.create({
          data: { sessionId: session.id, studentId: st.id, status: present ? (rnd() < 0.08 ? "late" : "present") : "absent", markedBy: present ? "self" : "faculty" },
        });
      }
    }
  }

  // ---------- assignments, submissions, materials ----------
  const asg1 = await db.assignment.create({ data: { sectionId: sections["CS502"].id, title: "ER Modelling & Normalization", description: "Model the campus placement domain as an ER diagram, convert to relational schema, and normalize to BCNF. Justify every design decision.", dueAt: day(-4, 23, 59), maxMarks: 20 } });
  const asg2 = await db.assignment.create({ data: { sectionId: sections["CS502"].id, title: "SQL & Indexing Workout", description: "Write and optimise 10 analytical SQL queries against the provided 2M-row dataset; include EXPLAIN plans and index rationale.", dueAt: day(6, 23, 59), maxMarks: 20 } });
  const asg3 = await db.assignment.create({ data: { sectionId: sections["CS501"].id, title: "Scheduler Simulation", description: "Implement and compare FCFS, SJF, and MLFQ schedulers on the supplied trace; report turnaround and response-time distributions.", dueAt: day(3, 23, 59), maxMarks: 25 } });
  await db.assignment.create({ data: { sectionId: sections["CS504"].id, title: "Bias-Variance Lab", description: "Empirically demonstrate the bias-variance tradeoff on three model families; submit a reproducible notebook.", dueAt: day(10, 23, 59), maxMarks: 20 } });
  for (let i = 0; i < 10; i++) {
    const st = cseStudents[i];
    await db.assignmentSubmission.create({
      data: { assignmentId: asg1.id, studentId: st.id, contentText: "Submitted ER diagram, relational mapping and BCNF decomposition with justification.", submittedAt: day(-5, 18 + (i % 4)), marks: i < 7 ? 13 + (i % 7) : null, feedback: i < 7 ? "Good decomposition; revisit the multivalued dependency in Q3." : null },
    });
  }
  await db.assignmentSubmission.create({ data: { assignmentId: asg3.id, studentId: cseStudents[1].id, contentText: "MLFQ implementation with metrics notebook attached.", submittedAt: day(-1, 21) } });
  const materials = [
    { sec: "CS502", title: "Week 1–3 Slides: Relational Model & SQL", kind: "slides", body: "Covers relational algebra, SQL DDL/DML, joins and set operations. Work through the 40 practice queries before the lab." },
    { sec: "CS502", title: "Indexing Deep-Dive (Reading)", kind: "notes", body: "B+ trees, hash indexes, covering indexes and when the optimiser ignores you. Read before Assignment 2." },
    { sec: "CS501", title: "xv6 Lab Setup Guide", kind: "notes", body: "Step-by-step environment setup for the xv6 scheduler labs, including QEMU flags and debugging with GDB." },
    { sec: "CS504", title: "Lecture 6 Recording: Regularization", kind: "video", body: "L1/L2 regularization, early stopping and dropout — recording and annotated notebook." },
    { sec: "CS503", title: "Wireshark Exercise Pack", kind: "link", body: "Capture files and questions for the TCP handshake, retransmission and congestion-window analysis exercises." },
  ];
  for (const m of materials) await db.material.create({ data: { sectionId: sections[m.sec].id, title: m.title, kind: m.kind, body: m.body } });

  // ---------- exams ----------
  const midterm = await db.exam.create({ data: { name: "Mid-Semester Examinations", type: "internal", termName: curTermName, status: "scheduled" } });
  const mtCourses = ["CS501", "CS502", "CS503", "CS504", "CS505"];
  for (let i = 0; i < mtCourses.length; i++) {
    await db.examSchedule.create({
      data: { examId: midterm.id, courseId: courses[mtCourses[i]].id, date: day(38 + i * 2), startMin: 600, durationMin: 120, room: `Exam Hall ${1 + (i % 3)}` },
    });
  }
  const endterm = await db.exam.create({ data: { name: "End-Semester Examinations", type: "end_term", termName: prevTermName, status: "completed" } });
  const gradeFor = (marks: number) => marks >= 90 ? ["O", 10] : marks >= 80 ? ["A+", 9] : marks >= 70 ? ["A", 8] : marks >= 60 ? ["B+", 7] : marks >= 50 ? ["B", 6] : marks >= 40 ? ["C", 5] : ["F", 0];
  const prevCourses = ["CS401", "CS402", "CS403", "CS404", "CS405"];
  for (const code of prevCourses) {
    await db.examSchedule.create({ data: { examId: endterm.id, courseId: courses[code].id, date: day(-70), startMin: 600, durationMin: 180, room: "Exam Hall 1" } });
  }
  // published results for previous term
  for (let i = 0; i < cseStudents.length; i++) {
    const st = cseStudents[i];
    for (const code of prevCourses) {
      const base = st.id === rahul.id ? 82 : 55 + Math.floor(rnd() * 40);
      const marks = Math.min(98, base + Math.floor(rnd() * 10) - 4);
      const [grade, gp] = gradeFor(marks);
      await db.result.create({
        data: { studentId: st.id, courseId: courses[code].id, termName: prevTermName, marks, grade: grade as string, gradePoints: gp as number, credits: courses[code].credits, status: "published" },
      });
    }
  }
  // provisional internal results for current term (for controller to moderate/publish)
  for (let i = 0; i < cseStudents.length; i++) {
    const st = cseStudents[i];
    for (const code of ["CS501", "CS502"]) {
      const marks = st.id === rahul.id ? 78 + Math.floor(rnd() * 10) : 45 + Math.floor(rnd() * 50);
      const [grade, gp] = gradeFor(marks);
      await db.result.create({
        data: { studentId: st.id, courseId: courses[code].id, termName: curTermName, marks, grade: grade as string, gradePoints: gp as number, credits: courses[code].credits, status: i % 3 === 0 ? "moderated" : "provisional" },
      });
    }
  }

  // ---------- finance ----------
  for (const p of Object.values(programs)) {
    const tuition = Math.round((p as any).feePerTermMinor * 0.78);
    const lab = Math.round((p as any).feePerTermMinor * 0.1);
    const lib = Math.round((p as any).feePerTermMinor * 0.05);
    const act = (p as any).feePerTermMinor - tuition - lab - lib;
    await db.feeStructure.create({
      data: { programId: (p as any).id, name: "Per-semester fee", totalMinor: (p as any).feePerTermMinor, heads: JSON.stringify([{ head: "Tuition", amountMinor: tuition }, { head: "Lab & Infrastructure", amountMinor: lab }, { head: "Library", amountMinor: lib }, { head: "Student Activities", amountMinor: act }]) },
    });
  }
  let invNo = 2600;
  const mkInvoice = async (st: any, label: string, netMinor: number, dueOffset: number, payFrac: number, method = "upi") => {
    const paid = Math.round(netMinor * payFrac);
    const inv = await db.invoice.create({
      data: {
        number: `INV-${invNo++}`, studentId: st.id, termLabel: label, netMinor, paidMinor: paid,
        status: payFrac >= 1 ? "paid" : payFrac > 0 ? "partial" : dueOffset < 0 ? "overdue" : "pending",
        dueDate: day(dueOffset),
        lineItems: JSON.stringify([{ head: "Tuition", amountMinor: Math.round(netMinor * 0.78) }, { head: "Lab & Infrastructure", amountMinor: Math.round(netMinor * 0.1) }, { head: "Library", amountMinor: Math.round(netMinor * 0.05) }, { head: "Student Activities", amountMinor: netMinor - Math.round(netMinor * 0.78) - Math.round(netMinor * 0.1) - Math.round(netMinor * 0.05) }]),
      },
    });
    if (paid > 0) await db.payment.create({ data: { invoiceId: inv.id, amountMinor: paid, method, reference: `TXN${900000 + invNo}`, createdAt: day(dueOffset - 12) } });
    return inv;
  };
  for (let i = 0; i < cseStudents.length; i++) {
    const st = cseStudents[i];
    await mkInvoice(st, prevTermName, 12500000, -140, 1);
    await mkInvoice(st, curTermName, 12500000, i % 4 === 3 ? -6 : 14, st.id === rahul.id ? 0.4 : i % 4 === 0 ? 1 : i % 4 === 1 ? 0.5 : 0, i % 2 ? "card" : "upi");
  }
  for (const st of otherStudents) await mkInvoice(st, curTermName, 9500000, 14, 0.5);

  // ---------- admissions ----------
  const cycle = await db.admissionCycle.create({ data: { name: "Admissions 2026–27", opensAt: day(-60), closesAt: day(30) } });
  const applicants = [
    ["Aarav Malhotra", "btech-cse", 94.2, 91, "shortlisted"], ["Diya Krishnamurthy", "btech-cse", 91.8, 88, "offered"],
    ["Vivaan Shah", "btech-cse", 88.5, 82, "under_review"], ["Anaya Bhattacharya", "mtech-ai", 86.0, 79, "submitted"],
    ["Reyansh Gupta", "btech-ece", 90.1, 85, "shortlisted"], ["Myra Deshpande", "bba", 87.4, null, "offered"],
    ["Advik Choudhury", "btech-me", 82.3, 74, "waitlisted"], ["Kiara Venkatesh", "mba", 78.9, 88, "under_review"],
    ["Vihaan Kapoor", "btech-cse", 76.5, 61, "rejected"], ["Saanvi Rajan", "bsc-physics", 92.7, null, "accepted"],
    ["Ayaan Siddiqui", "btech-cse", 89.9, 84, "submitted"], ["Prisha Hegde", "ba-english", 84.6, null, "submitted"],
    ["Arjun Bajaj", "mba", 81.2, 82, "shortlisted"], ["Navya Kulshreshtha", "btech-ece", 85.7, 77, "submitted"],
  ] as const;
  let refNo = 4101;
  for (const [name, prog, pct, ent, status] of applicants) {
    const first = (name as string).split(" ")[0].toLowerCase();
    await db.application.create({
      data: {
        refNo: `APP-2026-${refNo++}`, cycleId: cycle.id, programId: programs[prog as string].id,
        applicantName: name as string, email: `${first}.applicant@gmail.com`, phone: "+91 90000 11223",
        dob: "2008-03-14", previousSchool: "DAV Public School", qualifyingPct: pct as number,
        entranceScore: ent as number | null, statement: "I want to study at Aurora because of its research-led teaching and strong industry connect. My goal is to build technology that matters.",
        status: status as string, compositeScore: ent ? Math.round(((pct as number) * 0.4 + (ent as number) * 0.6) * 10) / 10 : (pct as number),
        offerDeadline: status === "offered" ? day(10) : null,
        createdAt: day(-30 + refNo % 20),
      },
    });
  }

  // ---------- library ----------
  const books = [
    ["Introduction to Algorithms", "Cormen, Leiserson, Rivest, Stein", "Computer Science", 8],
    ["Database System Concepts", "Silberschatz, Korth, Sudarshan", "Computer Science", 6],
    ["Operating System Concepts", "Silberschatz, Galvin, Gagne", "Computer Science", 6],
    ["Computer Networks", "Andrew S. Tanenbaum", "Computer Science", 5],
    ["Deep Learning", "Goodfellow, Bengio, Courville", "AI & Data Science", 4],
    ["Pattern Recognition and Machine Learning", "Christopher Bishop", "AI & Data Science", 3],
    ["Designing Data-Intensive Applications", "Martin Kleppmann", "Computer Science", 5],
    ["Clean Code", "Robert C. Martin", "Software Engineering", 6],
    ["The Pragmatic Programmer", "Hunt & Thomas", "Software Engineering", 4],
    ["Structure and Interpretation of Computer Programs", "Abelson & Sussman", "Computer Science", 3],
    ["Principles of Marketing", "Kotler & Armstrong", "Management", 7],
    ["Financial Management", "Prasanna Chandra", "Management", 5],
    ["Thinking, Fast and Slow", "Daniel Kahneman", "Psychology", 4],
    ["The Feynman Lectures on Physics Vol. 1", "Richard Feynman", "Physics", 5],
    ["Concepts of Modern Physics", "Arthur Beiser", "Physics", 4],
    ["Microelectronic Circuits", "Sedra & Smith", "Electronics", 5],
    ["Signals and Systems", "Alan Oppenheim", "Electronics", 4],
    ["Engineering Mechanics: Dynamics", "J.L. Meriam", "Mechanical", 5],
    ["A Brief History of Time", "Stephen Hawking", "Popular Science", 3],
    ["Wings of Fire", "A.P.J. Abdul Kalam", "Biography", 6],
    ["The Argumentative Indian", "Amartya Sen", "Humanities", 3],
    ["Norwegian Wood", "Haruki Murakami", "Fiction", 4],
  ] as const;
  const items: any[] = [];
  let isbn = 978810000001;
  for (const [title, authors, category, copies] of books) {
    items.push(await db.libraryItem.create({ data: { title: title as string, authors: authors as string, isbn: String(isbn++), category: category as string, copiesTotal: copies as number, copiesAvailable: copies as number } }));
  }
  const issue = async (item: any, user: any, dueOffset: number, returned = false) => {
    await db.loan.create({
      data: {
        itemId: item.id, borrowerId: user.id, issuedAt: day(dueOffset - 14), dueAt: day(dueOffset, 17),
        returnedAt: returned ? day(dueOffset - 2) : null,
        fineMinor: !returned && dueOffset < 0 ? Math.min(-dueOffset, 30) * 500 : 0,
      },
    });
    if (!returned) await db.libraryItem.update({ where: { id: item.id }, data: { copiesAvailable: { decrement: 1 } } });
  };
  await issue(items[1], demoStudentUser, 9);          // DBMS book, active
  await issue(items[6], demoStudentUser, -5);         // DDIA, overdue with fine
  await issue(items[0], demoStudentUser, -30, true);  // returned history
  const u2 = await db.user.findUnique({ where: { email: "au24cs002@aurora.edu" } });
  const u3 = await db.user.findUnique({ where: { email: "au24cs003@aurora.edu" } });
  await issue(items[2], u2!, 5); await issue(items[4], u3!, -2); await issue(items[7], u3!, 12);

  // ---------- hostel ----------
  const nilgiri = await db.hostel.create({ data: { name: "Nilgiri House (Men)", gender: "male", capacity: 240 } });
  const himalaya = await db.hostel.create({ data: { name: "Himalaya House (Women)", gender: "female", capacity: 200 } });
  const rooms: any[] = [];
  for (let f = 1; f <= 3; f++) for (let r = 1; r <= 8; r++) {
    rooms.push(await db.hostelRoom.create({ data: { hostelId: nilgiri.id, number: `N-${f}${String(r).padStart(2, "0")}`, capacity: 2 } }));
  }
  for (let f = 1; f <= 2; f++) for (let r = 1; r <= 8; r++) {
    rooms.push(await db.hostelRoom.create({ data: { hostelId: himalaya.id, number: `H-${f}${String(r).padStart(2, "0")}`, capacity: 2 } }));
  }
  const residents = cseStudents.filter((s) => s.hostelResident).concat(otherStudents.filter((s) => s.hostelResident));
  for (let i = 0; i < residents.length; i++) {
    await db.hostelAllocation.create({ data: { studentId: residents[i].id, roomId: rooms[Math.floor(i / 2)].id, fromDate: day(-22) } });
  }
  await db.outpass.create({ data: { studentId: rahul.id, reason: "Weekend visit home — cousin's wedding", outAt: day(-9, 8), expectedInAt: day(-7, 20), status: "closed", decidedBy: "Rajesh Kumar" } });
  await db.outpass.create({ data: { studentId: rahul.id, reason: "Hackathon at IIT Madras (team AuroraByte)", outAt: day(4, 7), expectedInAt: day(6, 21), status: "pending" } });
  await db.outpass.create({ data: { studentId: cseStudents[3].id, reason: "Medical appointment in the city", outAt: day(1, 9), expectedInAt: day(1, 18), status: "pending" } });

  // ---------- placement ----------
  const companiesData = [
    ["TCS Digital", "IT Services", "https://tcs.com"], ["Infosys", "IT Services", "https://infosys.com"],
    ["Zoho", "Product / SaaS", "https://zoho.com"], ["Flipkart", "E-commerce", "https://flipkart.com"],
    ["Bosch India", "Engineering / Automotive", "https://bosch.in"], ["Deloitte India", "Consulting", "https://deloitte.com"],
    ["Razorpay", "Fintech", "https://razorpay.com"],
  ] as const;
  const companies: any[] = [];
  for (const [name, sector, website] of companiesData) companies.push(await db.company.create({ data: { name: name as string, sector: sector as string, website: website as string } }));
  const postingsData = [
    [0, "Systems Engineer", "job", 7.5, 6.0, 20, "Chennai / Hybrid", "Full-stack development on enterprise platforms; DSA-heavy selection process with 3 rounds."],
    [2, "Member Technical Staff", "job", 12.0, 7.0, 15, "Chennai", "Product engineering role across Zoho's suite; strong CS fundamentals and a build-from-scratch mindset."],
    [3, "SDE Intern", "internship", 1.0, 7.5, 10, "Bengaluru", "6-month SDE internship on the supply-chain platform with a pre-placement offer track."],
    [6, "Software Engineer — Payments", "job", 18.0, 8.0, 12, "Bengaluru", "Own critical payment flows at India-scale. Systems design and Go/Java experience valued."],
    [5, "Business Technology Analyst", "job", 9.5, 6.5, 25, "Hyderabad", "Technology consulting across cloud and data engagements for Fortune 500 clients."],
    [4, "Graduate Engineer Trainee", "job", 8.0, 6.5, 30, "Coimbatore", "Rotational program across embedded software, manufacturing tech and EV systems."],
    [1, "Digital Specialist Engineer", "job", 9.0, 6.8, 22, "Pune", "Specialist track in cloud-native development; includes 4-month bootcamp at Mysuru campus."],
  ] as const;
  const postings: any[] = [];
  for (const [ci, title, type, ctc, cgpa, dl, loc, desc] of postingsData) {
    postings.push(await db.jobPosting.create({
      data: { companyId: companies[ci as number].id, title: title as string, type: type as string, ctcLakhs: ctc as number, minCgpa: cgpa as number, deadline: day(dl as number), location: loc as string, description: desc as string },
    }));
  }
  await db.placementApplication.create({ data: { postingId: postings[1].id, studentId: rahul.id, status: "shortlisted" } });
  await db.placementApplication.create({ data: { postingId: postings[3].id, studentId: rahul.id, status: "applied" } });
  for (let i = 1; i < 9; i++) {
    await db.placementApplication.create({ data: { postingId: postings[i % postings.length].id, studentId: cseStudents[i].id, status: ["applied", "shortlisted", "interview", "offered"][i % 4] } });
  }

  // ---------- grievances ----------
  const complaintsData = [
    ["Infrastructure", "Wi-Fi dead zone in Library Annexe", "The second floor of the library annexe has had no Wi-Fi coverage for two weeks; students preparing for placements are badly affected.", "in_progress", "high"],
    ["Hostel", "Water cooler on Nilgiri floor 2 not working", "The RO unit has been out of order since last Monday. Requesting urgent repair.", "open", "medium"],
    ["Academics", "Projector flickering in LH-204", "The projector display flickers constantly making slides unreadable from the back benches.", "resolved", "medium"],
    ["Cafeteria", "Request to extend mess dinner window", "Students returning from evening labs at 8:45 PM are missing dinner. Request extension to 9:30 PM.", "open", "low"],
    ["Transport", "Route 4 bus overcrowded in mornings", "The 8:10 AM Route 4 service regularly runs above capacity; requesting an additional bus.", "in_progress", "high"],
  ] as const;
  let cref = 501;
  for (const [category, title, desc, status, priority] of complaintsData) {
    await db.complaint.create({
      data: { refNo: `GRV-${cref++}`, category: category as string, title: title as string, description: desc as string, raisedById: demoStudentUser.id, status: status as string, priority: priority as string, resolution: status === "resolved" ? "Projector lamp replaced by facilities team on request; verified in person." : null, createdAt: day(-cref % 12) },
    });
  }

  // ---------- leave requests (faculty → HOD) ----------
  const facUser = await db.user.findUnique({ where: { email: "faculty@aurora.edu" } });
  const facUser2 = await db.user.findUnique({ where: { email: "n.gupta@aurora.edu" } });
  await db.leaveRequest.create({ data: { userId: facUser!.id, type: "duty", fromDate: day(12), toDate: day(14), reason: "Presenting a paper at COMAD/CODS 2026, Goa.", status: "pending" } });
  await db.leaveRequest.create({ data: { userId: facUser2!.id, type: "casual", fromDate: day(5), toDate: day(5), reason: "Personal work.", status: "pending" } });
  await db.leaveRequest.create({ data: { userId: facUser!.id, type: "medical", fromDate: day(-20), toDate: day(-18), reason: "Viral fever — medical certificate attached.", status: "approved", decidedBy: "Prof. Vikram Rao" } });

  // ---------- news ----------
  const news = [
    ["aurora-ranks-top-15-nirf", "Aurora climbs to Top 15 in NIRF Engineering Rankings", "Research", "A five-place jump powered by research output, placement outcomes and perception scores.", "Aurora University has been ranked 14th among engineering institutions in the latest NIRF rankings, up from 19th last year. The jump was driven by a 32% increase in cited publications, record placement outcomes, and top-quartile perception scores.\n\nVice-Chancellor Dr. Meera Krishnan credited the faculty and students: \"Rankings follow substance. Our investments in research infrastructure and teaching quality are compounding.\"\n\nThe university filed 21 patents this year and secured ₹48 crore in sponsored research funding."],
    ["quantum-lab-inauguration", "New Quantum Computing Lab inaugurated with 12-qubit testbed", "Research", "The ₹9-crore facility gives UG students hands-on access to real quantum hardware.", "The Department of Physical Sciences inaugurated a Quantum Computing Laboratory featuring a 12-qubit superconducting testbed, dilution refrigeration, and a cloud access layer that lets undergraduates queue experiments from their laptops.\n\nThe lab will anchor the new quantum-track electives launching next semester and is already supporting three sponsored projects."],
    ["placement-record-2026", "Placement season closes with 94% offers and a ₹52 LPA top offer", "Placements", "412 offers from 138 companies, with median CTC up 18% year-on-year.", "The 2025–26 placement season closed with 94% of registered students placed. Razorpay made the top offer of ₹52 LPA to a CSE final-year student, while the median CTC rose 18% to ₹8.6 LPA.\n\nFirst-time recruiters included two Y-Combinator startups and a Formula-E engineering team. The placement cell also facilitated 160 paid internships with an 80% PPO conversion rate."],
    ["hackathon-aurorathon-6", "Aurorathon 6.0 draws 1,400 hackers from 90 colleges", "Campus", "36 hours, 210 projects, and a winning team that built an offline-first telemedicine kit.", "The sixth edition of Aurorathon transformed the innovation centre into a 36-hour build marathon. Team MedMesh from Aurora took the ₹2-lakh grand prize for an offline-first telemedicine kit built on mesh networking.\n\nJudges from Google, Zoho and IISc mentored 210 project teams across health, climate and fintech tracks."],
    ["new-mtech-ai-cohort", "M.Tech AI program doubles intake after record applications", "Academics", "Applications rose 3.1× — the program adds a second cohort and new MLOps specialization.", "Following a 3.1× surge in applications, the M.Tech Artificial Intelligence program will admit a second cohort of 40 from the coming academic year. The expansion adds a new MLOps specialization, two faculty hires from industry research labs, and a dedicated GPU cluster upgrade to 64×H100."],
    ["alumni-endowment-gift", "Alumni endow ₹12-crore scholarship fund for first-generation students", "Community", "The Class of 2006 gift will fully fund 40 students every year.", "Marking their 20-year reunion, the Class of 2006 announced a ₹12-crore endowment that will fully fund tuition, hostel and living expenses for 40 first-generation college students every year.\n\n\"Aurora changed our lives; this is us holding the door open,\" said fund convenor Deepak Rao (CSE '06), now a VP of Engineering in Seattle."],
  ] as const;
  let ndays = 2;
  for (const [slug, title, tag, excerpt, body] of news) {
    await db.newsPost.create({ data: { slug: slug as string, title: title as string, tag: tag as string, excerpt: excerpt as string, body: body as string, publishedAt: day(-ndays) } });
    ndays += 6;
  }

  // ---------- events ----------
  const events = [
    ["techsummit-2026", "Aurora Tech Summit 2026", "seminar", "Two days of talks and workshops with engineering leaders from Razorpay, Zoho, Google and ISRO. Tracks on AI systems, fintech infrastructure and space tech.", "Convention Centre", 14, 16, 800],
    ["convocation-2026", "17th Annual Convocation", "convocation", "Degrees will be conferred on 1,240 graduates. Chief guest: Dr. S. Somanath. Families are warmly invited; live-streamed on the university channel.", "Main Amphitheatre", 45, 45, 3000],
    ["kalakriti-cultural-fest", "Kalakriti — Cultural Festival", "cultural", "Three evenings of music, theatre, dance battles and the Battle of Bands finale, with a headline concert on the final night.", "Open Air Theatre", 24, 26, 2500],
    ["research-colloquium-ml", "Research Colloquium: Trustworthy ML", "seminar", "Dr. Neha Gupta hosts speakers from CMU and Microsoft Research on robustness, interpretability and evaluation of modern ML systems.", "LH-108", 9, 9, 120],
    ["inter-college-sports", "Aurora Premier League — Inter-College Sports Meet", "sports", "Cricket, football, basketball and athletics across four days, with 42 colleges competing for the Aurora Cup.", "Sports Complex", 31, 34, 1500],
  ] as const;
  for (const [slug, title, kind, description, location, s, e, cap] of events) {
    const ev = await db.campusEvent.create({
      data: { slug: slug as string, title: title as string, kind: kind as string, description: description as string, location: location as string, startsAt: day(s as number, 9), endsAt: day(e as number, 18), capacity: cap as number },
    });
    if (slug === "techsummit-2026") {
      await db.eventRegistration.create({ data: { eventId: ev.id, name: "Rahul Verma", email: "student@aurora.edu" } });
    }
  }

  // ---------- leads ----------
  await db.lead.create({ data: { name: "Sunita Agarwal", email: "sunita.a@gmail.com", phone: "+91 98220 44556", topic: "Admissions", message: "My daughter scored 92% in CBSE. Is she eligible for B.Tech CSE, and when is the next counselling round?" } });
  await db.lead.create({ data: { name: "Mohammed Irfan", email: "irfan.m@outlook.com", topic: "Scholarships", message: "Do you offer merit scholarships for EWS category students in the MBA program?" } });
  await db.lead.create({ data: { name: "Grace D'Souza", email: "grace.dsouza@yahoo.com", topic: "Campus Visit", message: "We would like to book a campus tour for a group of 12 school students next month." } });

  // ---------- knowledge base (AI assistant grounding) ----------
  const kb = [
    ["Admissions 2026–27 — dates and process", "Applications for the 2026–27 academic year are open now and close in about a month (see the Apply page for the live deadline). The process: submit the online application with your 10+2 or degree marks → entrance/qualifying score review → shortlisting → offer letter with a 10-day acceptance window → fee payment confirms your seat. Apply at /apply. Application fee: ₹1,200 (waived for EWS applicants).", "admissions,apply,deadline,application"],
    ["B.Tech CSE eligibility and fees", "B.Tech Computer Science & Engineering requires 10+2 with PCM ≥ 75% and a valid AUCET/JEE score. The fee is ₹1,25,000 per semester (8 semesters, 160 credits, 120 seats). Details at /programs/btech-cse.", "btech,cse,eligibility,fees,computer science"],
    ["Fee payment", "Semester fees can be paid online from the student portal (Fees section) via UPI, card or net-banking. Invoices show a head-wise breakup. Late payment past the due date moves an invoice to Overdue and may attract a late fee of ₹100/day capped at ₹3,000. Contact accounts@aurora.edu for payment plans.", "fees,payment,invoice,pay,overdue"],
    ["Scholarships", "Aurora offers merit scholarships (top 5% of each entering cohort — 50% tuition waiver), the Class of 2006 First-Generation Fund (full funding for 40 students/year), sports scholarships, and facilitates government schemes (NSP, state post-matric). Apply through the Requests section of the student portal or write to scholarships@aurora.edu.", "scholarship,financial aid,merit,waiver"],
    ["Attendance policy", "Minimum 75% attendance per course is required to sit the end-semester examination. Between 65–75% requires a condonation request with valid documentation approved by the HOD. Attendance is captured in class via rotating QR codes and can be reviewed in the portal in real time. Chronic absence triggers advisories to the student and parent.", "attendance,75%,eligibility,shortage,condonation"],
    ["Examination and grading", "Each course has mid-semester (internal) and end-semester exams. Grading is on a 10-point scale: O (≥90), A+ (≥80), A (≥70), B+ (≥60), B (≥50), C (≥40), F (<40). CGPA is the credit-weighted average of grade points. Revaluation can be requested within 10 days of result publication for a fee of ₹800 per course.", "exam,grades,grading,cgpa,revaluation,results"],
    ["Hostel rules and outpass", "Hostels: Nilgiri House (men, 240 beds) and Himalaya House (women, 200 beds), twin-sharing with Wi-Fi, laundry and 24×7 security. In-time is 9:30 PM. Overnight or out-of-town travel needs an outpass requested from the portal and approved by the warden. Hostel fee: ₹45,000/semester including mess.", "hostel,outpass,warden,rooms,curfew,mess"],
    ["Library services", "The Central Library holds 1.2 lakh volumes plus IEEE, ACM, Springer and JSTOR digital access. Borrowing: students 4 books / 14 days, faculty 10 books / 30 days; two renewals if not reserved. Overdue fine: ₹5/day per book. Open 8 AM–11 PM (24×7 during exams).", "library,books,borrow,fine,renew,timings"],
    ["Placements overview", "The 2025–26 season closed at 94% placement with a top offer of ₹52 LPA (Razorpay) and median CTC ₹8.6 LPA across 138 recruiters. Students register through the placement portal; eligibility per posting is CGPA-based. The cell runs aptitude training, mock interviews and resume clinics every semester.", "placement,jobs,ctc,recruiters,internship"],
    ["Campus transport", "University buses cover 12 city routes (6:45 AM–9:30 PM). Semester pass: ₹9,000, purchasable at the transport office or via the accounts section. Live bus tracking is available in the mobile app.", "transport,bus,routes,pass"],
    ["Contacting the university", "Aurora University, Knowledge Corridor, Devanahalli, Bengaluru 562110. General: +91 80 4567 8900, info@aurora.edu. Admissions: admissions@aurora.edu. Accounts: accounts@aurora.edu. Office hours Mon–Sat 9 AM–5:30 PM. Use the Contact page to send an enquiry.", "contact,phone,email,address,office"],
    ["Grievances and anti-ragging", "Complaints can be raised (anonymously if needed) from the portal's Requests section and are tracked with an SLA — most are resolved within 48 hours. Aurora has a zero-tolerance anti-ragging policy; the 24×7 helpline is 1800-180-5522.", "complaint,grievance,ragging,helpline"],
    ["Academic calendar", "Monsoon semester: mid-June to end-November (mid-sems in August, end-sems in November). Spring semester: mid-December to mid-May. The current term is Monsoon 2026; mid-semester exams begin in about five weeks.", "calendar,semester,dates,term"],
    ["Wi-Fi and IT support", "Campus-wide 10 Gbps backbone with Wi-Fi 6 in all academic blocks and hostels. Login with your university credentials. IT helpdesk: ithelp@aurora.edu or extension 4444, LH block ground floor.", "wifi,internet,it,helpdesk"],
    ["Clubs and student life", "45+ student clubs across tech (coding, robotics, aero), culture (music, drama, film), sports, and social impact (NSS, sustainability). Kalakriti (cultural fest) and Aurorathon (hackathon) are the flagship events. Club fair happens in the first week of each Monsoon semester.", "clubs,student life,fest,activities"],
  ] as const;
  for (const [title, content, tags] of kb) {
    await db.knowledgeChunk.create({ data: { title: title as string, content: content as string, tags: tags as string } });
  }

  // ---------- notifications ----------
  const notify = (userId: string, title: string, body: string, category: string, link?: string, read = false) =>
    db.notification.create({ data: { userId, title, body, category, link, readAt: read ? day(-1) : null } });
  await notify(demoStudentUser.id, "Fee due in 14 days", "Your Monsoon 2026 invoice has ₹75,000 outstanding. Pay before the due date to avoid late fees.", "finance", "/portal/fees");
  await notify(demoStudentUser.id, "New assignment in CS502", "\"SQL & Indexing Workout\" is due in 6 days.", "academics", "/portal/courses");
  await notify(demoStudentUser.id, "Book overdue", "\"Designing Data-Intensive Applications\" was due 5 days ago. Current fine: ₹25.", "library", "/portal/library");
  await notify(demoStudentUser.id, "Shortlisted at Zoho", "You have been shortlisted for Member Technical Staff. Interview schedule will follow.", "placement", "/portal/placements");
  await notify(demoStudentUser.id, "Mid-semester exam schedule published", "Mid-sems begin in ~5 weeks. Check your exam timetable.", "exams", "/portal/results", true);
  await notify(facUser!.id, "Grading pending", "10 submissions in \"ER Modelling & Normalization\" — 3 still ungraded.", "academics", "/portal/teach");
  await notify(facUser!.id, "Leave request update", "Your medical leave (last month) was approved by Prof. Vikram Rao.", "hr", "/portal/requests", true);
  await notify(parent.id, "Attendance update for Rahul", "Rahul's overall attendance this term is trending around 88%. No action needed.", "academics", "/portal");
  await notify(parent.id, "Fee reminder", "₹75,000 outstanding for Monsoon 2026. Due in 14 days.", "finance", "/portal");
  const hodUser = await db.user.findUnique({ where: { email: "hod@aurora.edu" } });
  await notify(hodUser!.id, "2 leave requests pending", "Dr. Ananya Iyer and Dr. Neha Gupta have pending leave requests.", "hr", "/portal/approvals");
  await notify(admissionOfficer.id, "5 new applications", "New applications received for the 2026–27 cycle await review.", "admissions", "/portal/admissions");

  // ---------- audit trail ----------
  const audits = [
    [examCtrl.id, "Dr. Suresh Menon", "result.publish", "Result", prevTermName, `Published ${prevTermName} end-semester results (5 courses, 15 students)`],
    [admissionOfficer.id, "Arjun Nair", "admission.offer", "Application", "APP-2026-4102", "Offer issued to Diya Krishnamurthy (B.Tech CSE), 10-day deadline"],
    [accounts.id, "Kavitha Iyer", "payment.record", "Invoice", "INV-2601", "Recorded UPI payment of ₹1,25,000"],
    [warden.id, "Rajesh Kumar", "outpass.approve", "Outpass", "Rahul Verma", "Approved weekend outpass (family function)"],
    [admin.id, "Priya Raman", "cms.publish", "NewsPost", "placement-record-2026", "Published news article"],
    [hodUser!.id, "Prof. Vikram Rao", "leave.approve", "LeaveRequest", "Dr. Ananya Iyer", "Approved medical leave (3 days)"],
  ] as const;
  for (const [actorId, actorName, action, entityType, entityId, note] of audits) {
    await db.auditEvent.create({ data: { actorId: actorId as string, actorName: actorName as string, action: action as string, entityType: entityType as string, entityId: entityId as string, meta: JSON.stringify({ note }) , createdAt: day(-(Math.floor(rnd() * 6) + 1))} });
  }

  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
