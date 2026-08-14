import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../hooks/useAuthMutation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginComponent() {
  const navigate = useNavigate();
  const mutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Login</h2>
          </div>
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={LoginSchema}
            onSubmit={(values) => mutation.mutate(values)}
          >
            {({ isSubmitting, handleChange, values }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Email</label>
                  <Field
                    name="email"
                    as={Input}
                    type="email"
                    placeholder="Enter your email"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-destructive text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Field
                      name="password"
                      as={Input}
                      type={showPassword ? "text" : "password"}
                      value={values.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-destructive text-sm mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Login
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Forgot Password?{" "}
                  <a href="/forgot-password" className="text-primary hover:underline">
                    Reset Password
                  </a>
                </p>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
