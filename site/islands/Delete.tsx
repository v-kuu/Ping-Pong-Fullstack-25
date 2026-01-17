interface DeleteAccountProps {
  username: string;
  isOwnProfile?: boolean;
  isLoggedIn?: boolean;
}

export function DeleteAccount({
  username,
  isOwnProfile = false,
  isLoggedIn = false,
}: DeleteAccountProps) {
  const handleDeletion = async (username) => {
    const conf = window.confirm("Sure about this?")
    if (!conf) return;
    const res = await fetch(`/delete/${username}`)
      .then((response) => {
        location.reload();
      })
    .  catch((error) => {
      console.error("Failed to delete account", error);
    });
  }
  return (
  <form type= "submit">
    <label>
      <button
        class="btn btn-danger"
        onClick={isLoggedIn && handleDeletion(username)}
      >Delete Account</button>
    </label>
  </form>
)}