import RegisterForm from "./register-form";

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8 border border-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Register
        </h1>

        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
