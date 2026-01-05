import jsPDF from "jspdf";
import type { RegistrationForm } from "../interfaces/RegistrationForm";
import type { Committee } from "../interfaces/Committee";
import { SupabaseStorage } from "../supabase/storage";
import { FirestoreService } from "../firebase/firestore";
import type { RegistrationConfig } from "../interfaces/RegistrationConfig";

interface PDFGeneratorProps {
  formData: RegistrationForm;
  onGenerate?: () => void;
}

export class PDFGenerator {
  static async generateRegistrationPDF(
    formData: RegistrationForm,
    committees: Committee[] = [],
    rate: number = 180
  ): Promise<jsPDF> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    const primaryColor: [number, number, number] = [213, 49, 55];
    const darkGray: [number, number, number] = [36, 36, 36];

    let yPosition = 30;
    const lineHeight = 8;
    const sectionSpacing = 15;

    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 25, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("XVII ROBLESMUN", pageWidth / 2, 16, { align: "center" });

    yPosition += sectionSpacing;

    // Subtítulo
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Comprobante de Inscripción", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += sectionSpacing;

    // Línea decorativa
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(1);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += sectionSpacing;

    // === INFORMACIÓN DEL USUARIO ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Información del Usuario", 20, yPosition);
    yPosition += lineHeight + 2;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);

    const userInfo = [
      [
        "Nombre completo:",
        `${formData.userFirstName} ${formData.userLastName}`,
      ],
      ["Correo electrónico:", formData.userEmail],
      ["Institución:", formData.userInstitution],
      ["Tipo de usuario:", formData.userIsFaculty ? "Faculty" : "Estudiante"],
    ];

    userInfo.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 80, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    // === INFORMACIÓN GENERAL ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Información de la Inscripción", 20, yPosition);
    yPosition += lineHeight + 2;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);

    const generalInfo = [
      ["Fecha de inscripción:", new Date().toLocaleDateString("es-ES")],
      ["ID de transacción:", formData.transactionId || "Pendiente"],
      ["Método de pago:", formData.paymentMethod],
      [
        "Estado del pago:",
        formData.transactionId ? "Pendiente de verificación" : "Sin procesar",
      ],
    ];

    generalInfo.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 80, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    // === DETALLES DE INSCRIPCIÓN ===
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Detalles de Inscripción", 20, yPosition);
    yPosition += lineHeight + 2;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);

    const registrationDetails = [
      ["Cupos solicitados:", formData.seats.toString()],
      [
        "Tipo de inscripción:",
        formData.independentDelegate
          ? "Delegado independiente"
          : formData.isBigGroup
          ? "Delegación grande (13+ cupos)"
          : "Delegación pequeña (1-12 cupos)",
      ],
      ["Cupos de respaldo:", formData.requiresBackup ? "Sí" : "No"],
    ];

    registrationDetails.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(label, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(value, 80, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    // === CUPOS PRINCIPALES ===
    if (formData.seatsRequested.length > 0) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("Cupos Principales Seleccionados", 20, yPosition);
      yPosition += lineHeight + 2;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...darkGray);

      formData.seatsRequested.forEach((seat, index) => {
        // Divide el texto si es muy largo
        const seatLines = pdf.splitTextToSize(
          `${index + 1}. ${seat}`,
          pageWidth - 50
        );
        const itemHeight = seatLines.length * 5 + 2; // 5px por línea + 2px padding

        // Salto de página si no cabe el fondo completo
        if (yPosition + itemHeight > pageHeight - 30) {
          pdf.addPage();
          yPosition = 30;

          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...primaryColor);
          pdf.text(
            "Cupos Principales Seleccionados (continuación)",
            20,
            yPosition
          );
          yPosition += lineHeight + 2;

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...darkGray);
        }

        pdf.setFillColor(248, 248, 248);
        pdf.rect(20, yPosition - 2, pageWidth - 40, itemHeight, "F");

        seatLines.forEach((line: string, i: number) => {
          pdf.text(line, 25, yPosition + 5 * i + 3);
        });

        yPosition += itemHeight;
      });

      yPosition += 10;
    }

    if (formData.requiresBackup && formData.backupSeatsRequested.length > 0) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("Cupos de Respaldo Seleccionados", 20, yPosition);
      yPosition += lineHeight + 2;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...darkGray);

      formData.backupSeatsRequested.forEach((seat, index) => {
        const seatLines = pdf.splitTextToSize(
          `${index + 1}. ${seat}`,
          pageWidth - 50
        );
        const itemHeight = seatLines.length * 5 + 2;

        if (yPosition + itemHeight > pageHeight - 30) {
          pdf.addPage();
          yPosition = 30;

          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...primaryColor);
          pdf.text(
            "Cupos de Respaldo Seleccionados (continuación)",
            20,
            yPosition
          );
          yPosition += lineHeight + 2;

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...darkGray);
        }

        pdf.setFillColor(255, 248, 220);
        pdf.rect(20, yPosition - 2, pageWidth - 40, itemHeight, "F");

        seatLines.forEach((line: string, i: number) => {
          pdf.text(line, 25, yPosition + 5 * i + 3);
        });

        yPosition += itemHeight;
      });

      yPosition += 15;
    }

    // === RESUMEN FINANCIERO ===
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Resumen Financiero", 20, yPosition);
    yPosition += lineHeight + 2;

    // Cálculos actualizados
    const cuposCost = formData.seatsRequested.reduce((total, seatStr) => {
      const committeeName = seatStr.split(" - ")[0];
      const committee = committees.find((c) => c.name === committeeName);
      const costPerSeat = committee?.isDoubleSeat ? 30 : 15;
      return total + costPerSeat;
    }, 0);

    const normalSeatsCount = formData.seatsRequested.filter((seatStr) => {
      const committeeName = seatStr.split(" - ")[0];
      const committee = committees.find((c) => c.name === committeeName);
      return !committee?.isDoubleSeat;
    }).length;

    const doubleSeatsCount = formData.seatsRequested.filter((seatStr) => {
      const committeeName = seatStr.split(" - ")[0];
      const committee = committees.find((c) => c.name === committeeName);
      return committee?.isDoubleSeat;
    }).length;

    const delegationFee = formData.independentDelegate
      ? 0
      : formData.isBigGroup
      ? 30
      : 20;
    const totalAmount = cuposCost + delegationFee;
    const totalBolivars = totalAmount * rate;

    // Fondo para resumen financiero
    pdf.setFillColor(240, 255, 240);
    pdf.rect(20, yPosition - 2, pageWidth - 40, 45, "F");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);

    const financialSummary = [
      [`Cupos principales:`, `€${cuposCost.toFixed(2)}`],
      ...(normalSeatsCount > 0
        ? [
            [
              `  • Individuales (${normalSeatsCount} × €15.00):`,
              `€${(normalSeatsCount * 15).toFixed(2)}`,
            ],
          ]
        : []),
      ...(doubleSeatsCount > 0
        ? [
            [
              `  • Parejas (${doubleSeatsCount} × €30.00):`,
              `€${(doubleSeatsCount * 30).toFixed(2)}`,
            ],
          ]
        : []),
      [
        "Tarifa de delegación:",
        delegationFee > 0
          ? `€${delegationFee.toFixed(2)}`
          : "N/A (Delegado independiente)",
      ],
      ["", ""], // Línea en blanco
      ["TOTAL A PAGAR:", `€${totalAmount.toFixed(2)}`],
      ["Equivalente en Bs.:", `Bs. ${totalBolivars.toFixed(2)}`],
      ["Tasa de cambio:", `Bs. ${rate.toFixed(2)}/€`],
    ];

    financialSummary.forEach(([label, value]) => {
      if (label === "" && value === "") {
        yPosition += 3;
        return;
      }

      if (label === "TOTAL A PAGAR:") {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...primaryColor);
      } else if (label.startsWith("  •")) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...darkGray);
      }

      pdf.text(label, 25, yPosition + 3);
      pdf.text(value, pageWidth - 25, yPosition + 3, { align: "right" });
      yPosition += lineHeight;
    });

    yPosition += sectionSpacing;

    // === INFORMACIÓN IMPORTANTE ===
    if (yPosition > pageHeight - 50) {
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
      "• Este comprobante es válido únicamente con la verificación del pago.",
      "• Los cupos principales tienen prioridad sobre los de respaldo.",
      "• La asignación final de cupos depende de la disponibilidad.",
      "• Conserve este comprobante para futuras consultas.",
      "• Para dudas o consultas, contacte: mun@losroblesenlinea.com.ve",
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
    pdf.text(
      "XVII ROBLESMUN - Generado automáticamente",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    pdf.text(
      `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
      pageWidth / 2,
      footerY + 8,
      { align: "center" }
    );

    return pdf;
  }

  static async downloadPDF(formData: RegistrationForm): Promise<void> {
    // Cargar comités y tasa
    const committees = await FirestoreService.getAll<Committee>("committees");
    let rate = 180;
    try {
      const config = await FirestoreService.getById<RegistrationConfig>(
        "config",
        "registration"
      );
      if (config?.rate) {
        rate = config.rate;
      }
    } catch (error) {
      console.error("❌ Error cargando la tasa:", error);
    }

    const pdf = await this.generateRegistrationPDF(formData, committees, rate);
    const fileName = `roblesmun-inscripcion-${
      formData.transactionId || Date.now()
    }.pdf`;
    pdf.save(fileName);
  }

  static async getPDFBlob(formData: RegistrationForm): Promise<Blob> {
    // Cargar comités y tasa
    const committees = await FirestoreService.getAll<Committee>("committees");
    let rate = 180;
    try {
      const config = await FirestoreService.getById<RegistrationConfig>(
        "config",
        "registration"
      );
      if (config?.rate) {
        rate = config.rate;
      }
    } catch (error) {
      console.error("❌ Error cargando la tasa:", error);
    }

    const pdf = await this.generateRegistrationPDF(formData, committees, rate);
    return pdf.output("blob");
  }

  static async uploadPDFToSupabase(
    formData: RegistrationForm
  ): Promise<string> {
    try {
      console.log("🔄 Aplicando upload directo simplificado...");

      // Cargar comités y tasa
      const committees = await FirestoreService.getAll<Committee>("committees");
      let rate = 180;
      try {
        const config = await FirestoreService.getById<RegistrationConfig>(
          "config",
          "registration"
        );
        if (config?.rate) {
          rate = config.rate;
        }
      } catch (error) {
        console.error("❌ Error cargando la tasa:", error);
      }

      const pdf = await this.generateRegistrationPDF(
        formData,
        committees,
        rate
      );
      const pdfBlob = pdf.output("blob");

      const fileName = `solicitud-inscripcion-${formData.userInstitution}.pdf`;

      console.log("📄 Archivo:", fileName);
      console.log("📊 Tamaño:", pdfBlob.size, "bytes");

      const pdfFile = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      console.log("📤 Subiendo directamente sin folder...");
      const publicUrl = await SupabaseStorage.uploadPDF(pdfFile);

      console.log("✅ Upload directo exitoso:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("❌ Error en upload directo:", error);
      throw error;
    }
  }

  static async uploadAndDownloadPDF(
    formData: RegistrationForm
  ): Promise<string> {
    try {
      console.log("Iniciando proceso de subida y descarga...");

      const supabaseUrl = await this.uploadPDFToSupabase(formData);

      console.log("Descargando PDF localmente...");
      await this.downloadPDF(formData);

      return supabaseUrl;
    } catch (error) {
      console.error("Error en uploadAndDownloadPDF:", error);
      console.log("Fallback: descargando solo localmente...");
      await this.downloadPDF(formData);
      throw error;
    }
  }
}

// Componente React opcional para UI
const PDFGeneratorButton: React.FC<PDFGeneratorProps> = ({
  formData,
  onGenerate,
}) => {
  const handleGeneratePDF = async () => {
    try {
      await PDFGenerator.downloadPDF(formData);
      onGenerate?.();
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Intenta nuevamente.");
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-[#d53137] text-white px-6 py-3 rounded-lg hover:bg-[#b71c1c] transition-colors flex items-center gap-2"
    >
      📄 Descargar Comprobante PDF
    </button>
  );
};

export default PDFGeneratorButton;
