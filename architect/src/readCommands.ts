export function readCommandsText(): string {
  const textarea = document.querySelector("#editor textarea") as HTMLTextAreaElement;
  return textarea.value;
}
