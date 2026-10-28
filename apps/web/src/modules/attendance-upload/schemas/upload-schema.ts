import { z } from "zod";
export const attendanceUploadSchema = z.object({ date: z.date(), file: z.instanceof(File).nullable().refine((file): boolean => file !== null, "Choose an attendance workbook").refine((file) => !file || /\.xlsx$/i.test(file.name), "Choose an XLSX workbook. Legacy XLS files must be converted before upload.").refine((file) => !file || file.size <= 5 * 1024 * 1024, "The workbook must be 5 MB or smaller") });
export type AttendanceUploadValues = z.infer<typeof attendanceUploadSchema>;
