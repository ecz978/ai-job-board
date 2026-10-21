import { google, type classroom_v1 } from "googleapis";

function classroomClient(accessToken: string) {
  const oauth = new google.auth.OAuth2();
  oauth.setCredentials({ access_token: accessToken });
  return google.classroom({ version: "v1", auth: oauth });
}

export type CourseOption = { id: string; name: string; section: string | null };
export type StudentOption = { id: string; name: string };

export async function listTeachingCourses(accessToken: string): Promise<CourseOption[]> {
  const classroom = classroomClient(accessToken);
  const courses: classroom_v1.Schema$Course[] = [];
  let pageToken: string | undefined;

  do {
    const res = await classroom.courses.list({
      teacherId: "me",
      courseStates: ["ACTIVE"],
      pageSize: 100,
      pageToken,
    });
    courses.push(...(res.data.courses ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return courses.map((c) => ({
    id: c.id!,
    name: c.name ?? "(senza nome)",
    section: c.section ?? null,
  }));
}

// Restituisce solo id e nome: nessun dato di contatto dello studente viene letto o conservato.
export async function listStudents(accessToken: string, courseId: string): Promise<StudentOption[]> {
  const classroom = classroomClient(accessToken);
  const students: classroom_v1.Schema$Student[] = [];
  let pageToken: string | undefined;

  do {
    const res = await classroom.courses.students.list({
      courseId,
      pageSize: 100,
      pageToken,
    });
    students.push(...(res.data.students ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return students
    .filter((s) => s.userId)
    .map((s) => ({
      id: s.userId!,
      name: s.profile?.name?.fullName ?? "(senza nome)",
    }));
}

export type IndividualAssignmentInput = {
  courseId: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: classroom_v1.Schema$Date;
  dueTime: classroom_v1.Schema$TimeOfDay;
};

export async function createIndividualAssignment(
  accessToken: string,
  input: IndividualAssignmentInput,
) {
  const classroom = classroomClient(accessToken);
  const res = await classroom.courses.courseWork.create({
    courseId: input.courseId,
    requestBody: {
      title: input.title,
      description: input.description,
      workType: "ASSIGNMENT",
      state: "PUBLISHED",
      assigneeMode: "INDIVIDUAL_STUDENTS",
      individualStudentsOptions: { studentIds: [input.studentId] },
      dueDate: input.dueDate,
      dueTime: input.dueTime,
    },
  });
  return res.data;
}
