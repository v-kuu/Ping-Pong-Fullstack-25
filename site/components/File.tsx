export function LoadFile() {
  return (
    <form>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Pick a file</legend>
      <input id="file" type="file" class="file-input" />
      <label class="label" for="file">Max size 2MB</label>
    </fieldset>
    </form>
  );
}
