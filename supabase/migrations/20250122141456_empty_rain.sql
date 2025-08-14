-- Insert test data into submitted_invoices
INSERT INTO submitted_invoices (
  first_name,
  last_name,
  organization,
  email,
  document_date,
  file_url,
  file_name,
  file_size,
  year,
  month
) VALUES
  (
    'Jean',
    'Dupont',
    'MOBILGYM',
    'jean.dupont@example.com',
    '2024-01-15 10:00:00',
    'https://example.com/facture1.pdf',
    'facture1.pdf',
    1024576,
    '2024',
    '01'
  ),
  (
    'Marie',
    'Martin',
    'MOBILGYM',
    'marie.martin@example.com',
    '2024-01-20 14:30:00',
    'https://example.com/facture2.pdf',
    'facture2.pdf',
    2048576,
    '2024',
    '01'
  ),
  (
    'Pierre',
    'Durand',
    'MOBILGYM',
    'pierre.durand@example.com',
    '2024-02-05 09:15:00',
    'https://example.com/facture3.pdf',
    'facture3.pdf',
    1536576,
    '2024',
    '02'
  );