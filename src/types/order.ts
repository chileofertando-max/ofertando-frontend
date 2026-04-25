export interface Order {
  id: string;
  number: string;
  status: string;
  total: string;
  date: string;
  lineItems: { nodes: { name: string; quantity: number; total: string }[] };
}
