import DriveForm from "../DriveForm";

export default function DriveFormExample() {
  return (
    <div className="p-4">
      <DriveForm
        onSubmit={(data) => console.log("Form submitted:", data)}
      />
    </div>
  );
}
