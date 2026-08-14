import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../hooks/useAuthMutation";

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  });

export default function ForgotPasswordComponent() {
  const navigate = useNavigate();  
  const { toast } = useToast();
  // const mutation = useMutation({
  //    mutationFn: async (values: any) => {
  //     const res = await apiRequest("POST", "/auth/forgot-password", values);
  //     if (!res.ok) throw new Error("Failed to resetpassword");
  //     return res.json();
  //   },
  //   onSuccess: (data) => {
  //     navigate("/login")
  //      toast({
  //       title: "Success",
  //       description: "Please check your email to reset password.",
  //     });     
  //   },
  //   onError: (error: any) => {
  //     alert(error.message);
  //     toast({
  //       title: "Error",
  //       description: error.message || "Failed to send email",
  //       variant: "destructive",
  //     });
  //   },
  // });
  const mutation = useForgotPasswordMutation()

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Forgot Password</h2>
          </div>
          <Formik
            initialValues={{ email: ""}}
            validationSchema={ForgotPasswordSchema}
            onSubmit={(values) => mutation.mutate(values)}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Field
                    name="email"
                    as={Input}
                    type="email"
                    placeholder="Enter your email"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                   submit
                </Button>
                </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
