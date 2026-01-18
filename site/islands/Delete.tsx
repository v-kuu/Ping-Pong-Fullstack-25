interface DeleteAccountProps {
  username: string;
  isOwnProfile?: boolean;
  isLoggedIn?: boolean;
}

async function handleDeletion(username) {
  const conf = window.confirm("Sure about this?")
  if (!conf || !username) return;
  console.log(username);
  await fetch(`/api/delete`, {
    method: 'DELETE'
  }).then((response) => {
      console.log(response);
      location.reload();
  }).catch((error) => {
    console.error("Failed to delete account", error);
  });
};

export function DeleteAccount({
  username,
  isOwnProfile = false,
  isLoggedIn = false,
}: DeleteAccountProps) {
  return (
    <label>
      <button
        class="btn btn-warning btn-xl"
        onClick={() => { handleDeletion(username) }}
      >
        Delete Account
      </button>
    </label>
);};