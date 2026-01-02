import { LoadFile } from "../components/File.tsx";

export function ChangeAvatar() {
  return (
    <div class="w-full max-w-2xl">
      <div class="card bg-base-200 p-6">
        <div class="prose">
          <h2>Change your profile picture</h2>
          <LoadFile />
        </div>
      </div>
    </div>
  );
}
