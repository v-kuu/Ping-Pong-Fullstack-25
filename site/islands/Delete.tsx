interface DeleteAccountProps {
  id: number;
}

async function handleDeletion(id) {
  const conf = window.confirm("Sure about this?");
  if (!conf || !id) return;

  try {
    const response = await fetch(`/api/delete/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      window.location.href = "/login";
    } else {
      console.error("Failed to delete account");
      alert("Failed to delete account. Please try again.");
    }
  } catch (error) {
    console.error("Failed to delete account", error);
    alert("An error occurred while deleting account.");
  }
}

export function DeleteAccount({
  id,
}: DeleteAccountProps) {
  return (
    <div class="alert alert-warning items-center-safe">
      <p>Warning:<br/>You'll lose all data</p>
      <form
        method="DELETE"
        onSubmit={(e) => {
          e.preventDefault();
          handleDeletion(id);
        }}
        action={`/api/delete/${id}`}
      >
      <button
        class="btn btn-warning btn-xl"
        type="submit"
      >
        Delete Account
      </button>
      </form>
    </div>
  );
};