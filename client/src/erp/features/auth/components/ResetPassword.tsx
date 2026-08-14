import { useSearchParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useResetPasswordMutation } from "../hooks/useAuthMutation";

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string().min(6, "Password too short").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function ResetPasswordComponent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  // const mutation = useMutation({
  //   mutationFn: async (values: { password: string }) => {
  //     if (!token) throw new Error("Missing token");
  //     const res = await apiRequest("POST", "/auth/reset-password", {
  //       token,
  //       password: values.password,
  //     });

  //     if (!res.ok) throw new Error("Failed to reset password");
  //     return res.json();
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Success",
  //       description: "Password has been reset. You can now log in.",
  //     });
  //     navigate("/login");
  //   },
  //   onError: (error: any) => {
  //     toast({
  //       title: "Error",
  //       description: error.message || "Failed to reset password",
  //       variant: "destructive",
  //     });
  //   },
  // });

  const mutation = useResetPasswordMutation();
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center">Reset Your Password</h2>

          {!token ? (
            <div className="text-red-500 text-center">Invalid or missing token.</div>
          ) : (
            <Formik
              initialValues={{ password: "", confirmPassword: "" }}
              validationSchema={ResetPasswordSchema}
              onSubmit={(values) => mutation.mutate({ password: values.password , token: token})}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">New Password</label>
                    <Field name="password" type="password" as={Input} placeholder="New password" />
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Confirm Password</label>
                    <Field name="confirmPassword" type="password" as={Input} placeholder="Confirm password" />
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm" />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    Reset Password
                  </Button>
                </Form>
              )}
            </Formik>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
