export function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name.charAt(0) + '*';
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}
