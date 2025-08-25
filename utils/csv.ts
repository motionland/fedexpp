export function toCsv(data: any[]) {
  const headers = [
    "KAS ID",
    "Tracking Number",
    "Status",
    "FedEx Delivery Status",
    "Delivery Date",
    "Shipping Date",
    "Transit Time",
    "Destination",
    "Origin"
  ];
 
  const rows = data.map(row =>
    headers.map(header => {
      const key = header
        .toLowerCase()
        .replace(/ /g, '')
        .replace(/fedexdeliverystatus/, 'fedexDeliveryStatus')
        .replace(/trackingnumber/, 'trackingNumber')
        .replace(/shippingdate/, 'shippingDate')
        .replace(/deliverydate/, 'deliveryDate')
        .replace(/transittime/, 'transitTime')
        .replace(/destination/, 'destination')
        .replace(/origin/, 'origin')
        .replace(/status/, 'status')
        .replace(/kasid/, 'kasId');

      // For tracking number, show only last 12 digits
      if (key === 'trackingNumber' && row[key]) {
        return `"${row[key].slice(-12)}"`;
      }
      
      // Handle status object
      if (key === 'status' && row[key] && typeof row[key] === 'object') {
        return `"${row[key].name || ''}"`;
      }
      
      return `"${row[key] || ''}"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
} 