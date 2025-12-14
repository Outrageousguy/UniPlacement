import { AuthPage } from "../AuthForms";

export default function AuthFormsExample() {
  return (
    <AuthPage
      onLogin={(email, password) => console.log("Login:", { email, password })}
      onCoordinatorRegister={(data) => console.log("Coordinator register:", data)}
      onStudentRegister={(data) => console.log("Student register:", data)}
    />
  );
}
