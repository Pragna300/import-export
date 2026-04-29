/**
 * Utility to export data to a multi-sheet Excel file using XML format.
 * This works in most versions of Excel and doesn't require any external libraries.
 */
export const exportAnalyticsToExcel = (data) => {
  if (!data) return;

  const { summary, forecasts, history, product_performance, category_distribution } = data;

  // Header and Styles
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Color="#1E293B" ss:Bold="1"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;₹&quot;#,##0"/>
  </Style>
 </Styles>`;

  // --- SHEET 1: EXECUTIVE SUMMARY ---
  xml += `
 <Worksheet ss:Name="Executive Summary">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="Title"><Data ss:Type="String">Shnoor Logistics - Executive Summary</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Metric</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell>
   </Row>`;

  Object.entries(summary || {}).forEach(([key, value]) => {
    const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${label}</Data></Cell>
    <Cell><Data ss:Type="String">${value}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>`;

  // --- SHEET 2: FORECASTS ---
  xml += `
 <Worksheet ss:Name="AI Forecasts">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="Title"><Data ss:Type="String">Predictive Analytics Outlook</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Period</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Projected Revenue</Data></Cell>
   </Row>`;

  Object.entries(forecasts || {}).forEach(([key, value]) => {
    const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Projection';
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${label}</Data></Cell>
    <Cell><Data ss:Type="String">${value}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>`;

  // --- SHEET 3: HISTORICAL DATA ---
  xml += `
 <Worksheet ss:Name="Monthly History">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="Title"><Data ss:Type="String">Revenue and Expense Trends</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Month</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Expenses</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Transactions</Data></Cell>
   </Row>`;

  (history || []).forEach(item => {
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${item.month}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.revenue}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.expenses}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.transactions}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>`;

  // --- SHEET 4: PRODUCT PERFORMANCE ---
  xml += `
 <Worksheet ss:Name="Product Performance">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Column ss:Width="150"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="Title"><Data ss:Type="String">Top Performing Products</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Product Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Units Sold</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Value</Data></Cell>
   </Row>`;

  (product_performance || []).forEach(item => {
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${item.name}</Data></Cell>
    <Cell><Data ss:Type="Number">${item.count}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${item.value}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>`;

  xml += `</Workbook>`;

  // Finalize and Download
  const fileName = `shnoor_analytics_${new Date().toISOString().split('T')[0]}.xls`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportItemToExcel = (item, title, fileNamePrefix) => {
  if (!item) return;

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Color="#1E293B" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Details">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="300"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="Title"><Data ss:Type="String">${title}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Field</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell>
   </Row>`;

  Object.entries(item).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
    }
    const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${label}</Data></Cell>
    <Cell><Data ss:Type="String">${value}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const fileName = `${fileNamePrefix}_${new Date().toISOString().split('T')[0]}.xls`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
