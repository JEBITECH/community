import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, Mail, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import {
  userProfileByTokenMutation,
  userProfileUpdateMutation,
} from "../hooks/useAuthMutation";

// Email validation regex - requires valid format with TLD
const EMAIL_REGEX = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


// Validation schema
const RegisterSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string()
    .required("Email is required")
    .matches(EMAIL_REGEX, "Please enter a valid email address (e.g., user@example.com)"),
  phone: Yup.string().required("Phone is required"),
  password: Yup.string().min(6, "At least 6 characters").required("Password is required"),
});

export default function SetAccountDetailComponent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const mutation = userProfileByTokenMutation();
  const editMutation = userProfileUpdateMutation();
  const [isExpired, setIsExpired] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [initialValues, setInitialValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (token) {
      mutation.mutate(
        { token },
        {
          onSuccess: (data) => {
            setInitialValues({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phone: data.phone || "",
              password: ""
            });
            setUserEmail(data.email || "");
          },
          onError: (err: any) => {
            // Check if error message indicates expired token
            const errorMsg = err.message || "";
            if (errorMsg.includes("expired") || errorMsg.includes("Invalid token")) {
              setIsExpired(true);
            } else {
              toast({
                title: "Error",
                description: errorMsg || "Failed to fetch user",
                variant: "destructive",
              });
            }
          },
        }
      );
    } else {
      // No token provided
      setIsExpired(true);
    }
  }, [token]);

  // Show expiration message if token is expired
  if (isExpired) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl border-2 border-destructive/20">
          <CardContent className="p-8 space-y-6 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-destructive" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive-foreground" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Invitation Link Expired</h2>
              <p className="text-muted-foreground text-sm">
                This invitation link has expired or is no longer valid.
              </p>
            </div>

            {/* Message */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-foreground">Need a new invitation?</p>
                  <p className="text-xs text-muted-foreground">
                    Please contact your administrator to resend the invitation email.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full"
                variant="default"
              >
                Go to Login
              </Button>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Invitation links expire after a certain period for security reasons.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center">Setup Your ERP Account</h2>

          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={RegisterSchema}
            onSubmit={(values, { setSubmitting }) => {
              editMutation.mutate(
                { ...values, token, isActive: true },
                {
                  onSuccess: () => {
                    toast({
                      title: "Success",
                      description: "Your account has been updated!",
                    });
                  },
                  onError: (error: any) => {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to update user",
                      variant: "destructive",
                    });
                  },
                }
              );
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, setFieldValue, values }) => (
              <Form className="space-y-4">
                {/* First/Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <Field name="firstName" as={Input} placeholder="First name" />
                    <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <Field name="lastName" as={Input} placeholder="Last name" />
                    <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Field name="email" type="email" as={Input} placeholder="Enter your email" />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <Field name="phone" type="tel" as={Input} placeholder="Enter your phone number" />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm" />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Field name="password" type="password" as={Input} placeholder="Enter your password" />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isSubmitting || editMutation.isPending}>
                  {editMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
