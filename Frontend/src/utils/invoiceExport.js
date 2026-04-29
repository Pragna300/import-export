import * as XLSX from 'xlsx';

const DEFAULT_PAGE_SIZE = 100;
const INVOICE_TYPE_KEYWORD = 'invoice';

const resolveInvoiceType = (document) => {
  const directType = document.doc_type;
  const extractedType = document.extracted_data?.doc_type;
  const rawExtractedType = document.extracted_data?.raw?.doc_type;
  return (directType || extractedType || rawExtractedType || '').toString().toLowerCase();
};

const getFileNameFromPath = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return '';
  }

  const parts = fileUrl.split('/');
  return parts[parts.length - 1] || fileUrl;
};

const normalizeValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
};

const mapInvoiceDocumentToRow = (document) => {
  const extractedData = document.extracted_data || {};
  const hsnResult = extractedData.hsn_result || {};
  const dutyResult = extractedData.duty_result || {};
  const riskResult = extractedData.risk_result || {};

  return {
    document_id: document.id ?? '',
    doc_type: document.doc_type ?? '',
    status: document.status ?? '',
    created_at: document.created_at ? new Date(document.created_at).toISOString() : '',
    file_name: getFileNameFromPath(document.file_url),
    shipment_id: document.shipment_id ?? '',
    shipment_code: extractedData.shipment_code ?? '',
    product_name: extractedData.product_name ?? '',
    hsn_code: extractedData.hsn_code ?? '',
    quantity: extractedData.quantity ?? '',
    price: extractedData.price ?? '',
    currency: extractedData.currency ?? '',
    country: extractedData.country ?? '',
    destination_country: extractedData.destination_country ?? '',
    description: extractedData.description ?? '',
    hsn_result_code: hsnResult.hsn_code ?? '',
    hsn_confidence_score: normalizeValue(hsnResult.confidence_score),
    hsn_model_version: hsnResult.model_version ?? '',
    duty_assessable_value: normalizeValue(dutyResult.assessable_value),
    duty_rate: normalizeValue(dutyResult.duty_rate),
    tax_rate: normalizeValue(dutyResult.tax_rate),
    duty_amount: normalizeValue(dutyResult.duty_amount),
    tax_amount: normalizeValue(dutyResult.tax_amount),
    other_charges: normalizeValue(dutyResult.other_charges),
    total_cost: normalizeValue(dutyResult.total_cost),
    rule_source: dutyResult.rule_source ?? '',
    risk_score: normalizeValue(riskResult.risk_score),
    risk_level: riskResult.risk_level ?? '',
    risk_reason: riskResult.reason ?? '',
    risk_model_version: riskResult.model_version ?? '',
  };
};

const fetchAllDocuments = async (apiBaseUrl, pageSize = DEFAULT_PAGE_SIZE) => {
  const allDocuments = [];
  let skip = 0;

  while (true) {
    const response = await fetch(`${apiBaseUrl}/documents/?skip=${skip}&limit=${pageSize}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice documents.');
    }

    const pageData = await response.json();
    if (!Array.isArray(pageData)) {
      throw new Error('Unexpected response while fetching documents.');
    }

    allDocuments.push(...pageData);

    if (pageData.length < pageSize) {
      break;
    }

    skip += pageSize;
  }

  return allDocuments;
};

const filterInvoiceDocuments = (documents) => {
  return documents.filter((document) => {
    const type = resolveInvoiceType(document);
    return type.includes(INVOICE_TYPE_KEYWORD);
  });
};

export const exportInvoicesToExcel = async ({
  apiBaseUrl,
  filePrefix = 'shnoor_invoices',
} = {}) => {
  if (!apiBaseUrl) {
    throw new Error('API base URL is required for invoice export.');
  }

  const allDocuments = await fetchAllDocuments(apiBaseUrl);
  const invoiceDocuments = filterInvoiceDocuments(allDocuments);

  if (invoiceDocuments.length === 0) {
    return { exportedCount: 0 };
  }

  const rows = invoiceDocuments.map(mapInvoiceDocumentToRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

  const date = new Date().toISOString().split('T')[0];
  const fileName = `${filePrefix}_${date}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return { exportedCount: rows.length, fileName };
};
