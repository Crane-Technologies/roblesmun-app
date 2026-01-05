import jsPDF from "jspdf";
import type { RegistrationForm } from "../interfaces/RegistrationForm";

export interface AssignmentData {
  registrationId: string;
  institution: string;
  assignedSeats: string[];
  assignmentDate: string;
  notes?: string;
}

export class AssignmentsPDFGenerator {
  static generateAssignmentsPDF(
    registration: RegistrationForm & { id: string },
    assignedSeats: string[]
  ): jsPDF {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // Colores
    const primaryColor: [number, number, number] = [213, 49, 55];
    const darkGray: [number, number, number] = [36, 36, 36];
    const greenColor: [number, number, number] = [34, 197, 94];

    let yPosition = 30;
    const lineHeight = 8;
    const sectionSpacing = 15;

    // === HEADER ===
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 25, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("XVII ROBLESMUN", pageWidth / 2, 16, { align: "center" });

    // Subtítulo
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Asignación de Cupos", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += sectionSpacing;

    // Línea decorativa
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(1);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += sectionSpacing;

    // === INFORMACIÓN DE LA INSTITUCIÓN ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Información de la Institución", 20, yPosition);
    yPosition += lineHeight + 2;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);

    const institutionInfo = [
      ["Institución:", registration.userInstitution],
      [
        "Responsable:",
        `${registration.userFirstName} ${registration.userLastName}`,
      ],
      ["Email de contacto:", registration.userEmail],
      [
        "Tipo de usuario:",
        registration.userIsFaculty ? "Faculty" : "Estudiante",
      ],
    ];

    institutionInfo.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 80, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    pdf.setFillColor(240, 255, 240);
    pdf.rect(20, yPosition - 5, pageWidth - 40, 30, "F");

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Detalles de Asignación", 25, yPosition);
    yPosition += lineHeight + 2;

    const assignmentInfo = [
      ["Fecha de asignación:", new Date().toLocaleDateString("es-ES")],
      ["ID de inscripción:", registration.transactionId],
      ["Cupos solicitados:", registration.seats.toString()],
      ["Cupos asignados:", assignedSeats.length.toString()],
    ];

    pdf.setFontSize(10);
    assignmentInfo.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...darkGray);
      pdf.text(label, 25, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...greenColor);
      pdf.text(value, 90, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    if (assignedSeats.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text(`Cupos Asignados (${assignedSeats.length})`, 20, yPosition);
      yPosition += lineHeight + 2;

      pdf.setFillColor(240, 255, 240);
      const listHeight = assignedSeats.length * 6 + 10;
      pdf.rect(20, yPosition - 2, pageWidth - 40, listHeight, "F");

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...darkGray);

      assignedSeats.forEach((seat, index) => {
        pdf.setTextColor(...greenColor);
        pdf.text(`✓ ${index + 1}.`, 25, yPosition + 3);
        pdf.setTextColor(...darkGray);
        pdf.text(seat, 40, yPosition + 3);
        yPosition += 6;
      });

      yPosition += 15;
    }

    const unassignedSeats = registration.seatsRequested.filter(
      (seat) => !assignedSeats.includes(seat)
    );

    if (unassignedSeats.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text(`Cupos No Asignados (${unassignedSeats.length})`, 20, yPosition);
      yPosition += lineHeight + 2;

      pdf.setFillColor(255, 240, 240);
      const listHeight = unassignedSeats.length * 6 + 10;
      pdf.rect(20, yPosition - 2, pageWidth - 40, listHeight, "F");

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...darkGray);

      unassignedSeats.forEach((seat, index) => {
        pdf.setTextColor(220, 38, 38);
        pdf.text(`✗ ${index + 1}.`, 25, yPosition + 3);
        pdf.setTextColor(...darkGray);
        pdf.text(seat, 40, yPosition + 3);
        yPosition += 6;
      });

      yPosition += 15;
    }

    // === RESUMEN ===
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, yPosition - 5, pageWidth - 40, 50, "F");

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Resumen de Asignación", 25, yPosition);
    yPosition += lineHeight + 2;

    const summaryInfo = [
      ["Total solicitado:", `${registration.seatsRequested.length} cupos`],
      ["Total asignado:", `${assignedSeats.length} cupos`],
      [
        "Porcentaje asignado:",
        `${Math.round(
          (assignedSeats.length / registration.seatsRequested.length) * 100
        )}%`,
      ],
      [
        "Estado:",
        assignedSeats.length === registration.seatsRequested.length
          ? "Completa"
          : "Parcial",
      ],
    ];

    pdf.setFontSize(10);
    summaryInfo.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...darkGray);
      pdf.text(label, 25, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...greenColor);
      pdf.text(value, 100, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    // === INFORMACIÓN IMPORTANTE ===
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Información Importante", 20, yPosition);
    yPosition += lineHeight + 2;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);

    const importantInfo = [
      "• Esta asignación es definitiva y no está sujeta a cambios.",
      "• Los cupos asignados deben ser confirmados por la institución.",
      "• Cualquier consulta debe dirigirse a: mun@losroblesenlinea.com.ve",
      "• Conserve este documento para futuras referencias.",
      "• La participación está sujeta a la confirmación del pago.",
    ];

    importantInfo.forEach((info) => {
      const lines = pdf.splitTextToSize(info, pageWidth - 50);
      lines.forEach((line: string) => {
        pdf.text(line, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
    });

    // === FOOTER ===
    const footerY = pageHeight - 20;
    pdf.setDrawColor(...primaryColor);
    pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(128, 128, 128);
    pdf.text("XVII ROBLESMUN - Asignación de Cupos", pageWidth / 2, footerY, {
      align: "center",
    });
    pdf.text(
      `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
      pageWidth / 2,
      footerY + 8,
      { align: "center" }
    );

    return pdf;
  }

  static downloadAssignmentsPDF(
    registration: RegistrationForm & { id: string },
    assignedSeats: string[]
  ): void {
    const pdf = this.generateAssignmentsPDF(registration, assignedSeats);
    const fileName = `asignacion-${registration.userInstitution.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}-${Date.now()}.pdf`;
    pdf.save(fileName);
  }

  static getAssignmentsPDFBlob(
    registration: RegistrationForm & { id: string },
    assignedSeats: string[]
  ): Blob {
    const pdf = this.generateAssignmentsPDF(registration, assignedSeats);
    return pdf.output("blob");
  }
}
