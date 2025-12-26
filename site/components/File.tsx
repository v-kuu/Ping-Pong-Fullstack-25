export function LoadFile() { // RABBIT: Component name 'LoadFile' doesn't match filename 'File.tsx'. Rename to match or rename file.
  return (
    <form> // RABBIT: Form has no onSubmit handler and won't function. Add onSubmit prop and proper props interface.
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Pick a file</legend>
      <input id="file" type="file" class="file-input" />
      <label class="label" for="file">Max size 2MB</label>
    </fieldset>
    </form>
  );
}
