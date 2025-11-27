// Script untuk convert Markdown ke PDF
// Install dependencies dulu: npm install markdown-pdf

const markdownpdf = require("markdown-pdf");
const fs = require("fs");

const inputFile = "./MATERI_PRESENTASI_SALES_TEAM.md";
const outputFile = "./MATERI_PRESENTASI_SALES_TEAM.pdf";

const options = {
  cssPath: "./pdf-style.css",
  paperFormat: "A4",
  paperOrientation: "portrait",
  paperBorder: "2cm",
  renderDelay: 1000,
  runningsPath: "./pdf-header-footer.js"
};

markdownpdf(options)
  .from(inputFile)
  .to(outputFile, function () {
    console.log("✅ PDF berhasil dibuat: " + outputFile);
  });
