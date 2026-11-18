// bklit-ui 의 cn() 대신: 클래스 이름 합치기만 한다(clsx·tailwind-merge 없이).
export type ClassValue = string | number | false | null | undefined;
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}
