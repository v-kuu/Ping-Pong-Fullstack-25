import { Check } from "./Icons";

interface SuccessCardProps {
  title: string;
  message: string;
  buttonText: string;
  buttonHref: string;
}

export function SuccessCard({
  title,
  message,
  buttonText,
  buttonHref,
}: SuccessCardProps) {
  return (
    <div class="card text-center py-10 space-y-4">
      <div class="mx-auto w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center">
        <Check />
      </div>
      <h2 class="text-3xl font-bold text-white">{title}</h2>
      <p class="text-gray-300">{message}</p>
      <div class="flex flex-col gap-2 w-full mt-4">
        <a href={buttonHref} class="btn btn-primary w-full py-3">
          {buttonText}
        </a>
      </div>
    </div>
  );
}
