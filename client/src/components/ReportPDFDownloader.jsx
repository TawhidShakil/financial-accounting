import jsPDF from "jspdf";
import "jspdf-autotable";
import { FiPrinter } from "react-icons/fi";

export default function ReportPDFDownloader({
  companyName = "NextFin",
  reportTitle = "Income Statement",
  reportPeriod = "",
  columns = [],
  data = [],
  totals = {},
  netIncome = null,
  filename = "report.pdf"
}) {
  const handleDownload = () => {
    const doc = new jsPDF();

    // Header section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(companyName, 105, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text(reportTitle, 105, 28, { align: "center" });

    if (reportPeriod) {
      doc.setFontSize(12);
      doc.text(reportPeriod, 105, 36, { align: "center" });
    }

    // Table section
    doc.autoTable({
      head: [columns],
      body: data,
      startY: 46,
      theme: "grid",
      styles: { fontSize: 11, halign: "right" },
      headStyles: { fillColor: [225, 225, 225], textColor: [0,0,0], halign: "right", fontStyle: "bold" },
      columnStyles: { 0: { halign: "left" } },
      foot: totals ? [ totals ] : undefined,
      footStyles: { fillColor: [225,225,225], textColor: [0,0,0], fontStyle: "bold" }
    });

    // Net Income/Loss (if given)
    if (netIncome !== null) {
      const endY = doc.lastAutoTable.finalY || 46;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        (netIncome >= 0 ? "Net Income: " : "Net Loss: ") +
          "৳ " +
          Math.abs(netIncome).toFixed(2),
        200 - 16,
        endY + 14,
        { align: "right" }
      );
    }

    doc.save(filename);
  };

  return (
    <button
      onClick={handleDownload}
      className="p-2 mb-6 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition flex items-center"
      title="Download as PDF"
      style={{ lineHeight: 0 }}
    >
      <FiPrinter className="w-6 h-6" />
    </button>
  );
}
