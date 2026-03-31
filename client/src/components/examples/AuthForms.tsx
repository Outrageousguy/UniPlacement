import { AuthPage } from "../AuthForms";

export default function AuthFormsExample() {
  return (
    <AuthPage
      onBack={() => {}}
      onLogin={(email, password, role) => console.log("Login:", { email, password, role })}
      onCoordinatorRegister={(data) => console.log("Coordinator register:", data)}
      onStudentRegister={(data) => console.log("Student register:", data)}
    />
  );
}
