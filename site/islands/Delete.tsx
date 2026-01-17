interface DeleteAccountProps {
  username: string;
  isOwnProfile?: boolean;
  isLoggedIn?: boolean;
}

const handleDeletion = async (username) => {
  const conf = window.confirm("Sure about this?")
  if (!conf) return;
  const res = await fetch(`/api/delete/${username}`)
    .then((response) => {
      location.reload();
    })
  .  catch((error) => {
    console.error("Failed to delete account", error);
  });
};

export function DeleteAccount({
  username,
  isOwnProfile = false,
  isLoggedIn = false,
}: DeleteAccountProps) {
  return (
  <form type= "submit" class="card rounded-2xl backdrop-blur-xl gap-5">
  <h1 class="font-bold text-xl">
    Think twice
  </h1>
    <label>
      <button
        class="btn btn-warning btn-xl"
        onClick={handleDeletion}
      >
        Delete Account
      </button>
    </label>
  </form>
    )}