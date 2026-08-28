import Application from "@/api/app";
import Auth from "@/api/auth";
import ForgotPasswordModal from "@/components/auth/forgot-password-modal";
import CustomTimezoneField from "@/components/CustomTimezoneField/CustomTimezoneField";
import SimpleDatePicker from "@/components/SimpleDatePicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { validateEmail, validatePassword } from "@/lib/utils";
import { biometric } from "@/services/biometric";
import { secureStorage } from "@/services/secureStorage";
import { BiometryType } from "@aparajita/capacitor-biometric-auth";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  LogIn,
  ScanFace,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useLocation } from "wouter";
import { openExternalUrl } from "@/lib/open-external-url";
// import logoImage from "@assets/logo.png";

interface RegisterData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date | null;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  phone: string;
  timeZone: string;
  photo: string;
}

export default function AuthPage() {
  const logoImage = "./logo.png";
  const { toast } = useToast();
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [errorsLogin, setErrorsLogin] = useState({
    email: "",
    password: "",
  });
  const [errorsRegister, setErrorsRegister] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
  });
  const [stage, setStage] = useState(1);
  const [fadeClass, setFadeClass] = useState("opacity-100");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTab, setCurrentTab] = useState("login");
  const [registerStep, setRegisterStep] = useState(1);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: null,
    address: "",
    phone: "",
    timeZone: "",
    photo: "",
  });
  const [photoError, setPhotoError] = useState("");
  const [photo, setPhoto] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<{
    name: string;
    url: string;
    type: string;
    size: number;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve({
          name: file.name,
          url: base64,
          type: file.type,
          size: file.size,
        });
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const isAllowedPhotoFile = (file: File): boolean => {
    const allowedTypes = new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/pjpeg",
    ]);
    if (file.type && allowedTypes.has(file.type.toLowerCase())) {
      return true;
    }
    // iOS / some WebViews report an empty MIME type — fall back to extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    return extension === "jpg" || extension === "jpeg" || extension === "png";
  };

  const applySelectedPhoto = async (file: File | undefined | null) => {
    if (!file) return;

    const maxSizeInBytes = 3 * 1024 * 1024;
    if (!isAllowedPhotoFile(file) || file.size > maxSizeInBytes) {
      setPhotoError("File exceeds 3 MB or has an unsupported format.");
      return;
    }

    try {
      setPhotoError("");
      const res = await convertToBase64(file);
      setPhoto(res.url);
      setRegisterData((prev) => ({ ...prev, photo: res.url }));
    } catch {
      setPhotoError("Could not read this image. Please try another photo.");
    }
  };

  const clearSelectedPhoto = () => {
    setPhoto("");
    setPhotoError("");
    setRegisterData((prev) => ({ ...prev, photo: "" }));
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  useEffect(() => {
    const biometricEnabled = localStorage.getItem("biometric_enabled");
    if (biometricEnabled === "true") {
      setBiometricEnabled(true);
    } else {
      setBiometricEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (stage === 1) {
      const timer = setTimeout(() => {
        setFadeClass("opacity-0");
        setTimeout(() => {
          setStage(2);
          setFadeClass("opacity-100");
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleContinue = () => {
    setFadeClass("opacity-0");
    setTimeout(() => {
      setStage(3);
      setFadeClass("opacity-100");
    }, 500);
  };
  const [brandInfo, setBrandInfo] = useState<{
    last_update?: string;
    logo: string;
    name: string;
    headline: string;
    primary_color: string;
    secondary_color: string;
    tone?: string;
    focus_area?: string;
    slug?: string;
  }>();

  useEffect(() => {
    const readClinicSlug = () =>
      (new URLSearchParams(window.location.search).get("clinic") || "")
        .trim()
        .toLowerCase();

    const applyStoredBrand = () => {
      const storedBrandInfo = localStorage.getItem("brand_info");
      if (!storedBrandInfo) {
        return;
      }
      try {
        setBrandInfo(JSON.parse(storedBrandInfo));
      } catch (error) {
        console.error("Error parsing brand_info from localStorage:", error);
      }
    };

    const loadPublicBrand = (clinicSlug: string) => {
      Application.getPublicBrandInfo(clinicSlug)
        .then((res) => {
          const info = res.data?.brand_elements;
          if (!info) {
            return;
          }
          setBrandInfo(info);
          localStorage.setItem("brand_info", JSON.stringify(info));
          localStorage.setItem("clinic_slug", clinicSlug);
        })
        .catch(() => {
          setBrandInfo(undefined);
        });
    };

    const loadBrand = () => {
      const clinicSlug = readClinicSlug();
      if (clinicSlug) {
        loadPublicBrand(clinicSlug);
        return;
      }
      applyStoredBrand();
    };

    loadBrand();
    window.addEventListener("popstate", loadBrand);
    return () => window.removeEventListener("popstate", loadBrand);
  }, []);
  const fillTestCredentials = () => {
    setLoginData({
      email: "test@holisticare.com",
      password: "password123",
    });
  };
  const [location, navigate] = useLocation();
  // const CallLoginAuthApi = async (
  //   isRegister = false,
  //   credentials?: { email: string; password: string }
  // ) => {
  //   setIsLoadingLogin(true);
  //   const data = {
  //     email: credentials?.email || loginData.email,
  //     password: credentials?.password || loginData.password,
  //   };
  //   if (isRegister) {
  //     data.email = registerData.email;
  //     data.password = registerData.password;
  //   }
  //   Auth.login(data.email, data.password)
  //     .then((res) => {
  //       localStorage.setItem("health_session", res.data.access_token);
  //       localStorage.setItem("token", res.data.access_token);
  //       localStorage.setItem("encoded_mi", res.data.encoded_mi);
  //       if (!isRegister) {
  //         toast({
  //           title: "Welcome back!",
  //           description: "You have successfully signed in.",
  //         });
  //       }
  //       setTimeout(() => {
  //         navigate("/");
  //         // window.location.reload();
  //       }, 500);
  //     })
  //     .catch((res) => {
  //       if (res.response.data.detail) {
  //         if (
  //           res.response.data.detail.includes("email") ||
  //           res.response.data.detail.includes("Email")
  //         ) {
  //           setErrorsLogin({
  //             ...errorsLogin,
  //             email: res.response.data.detail,
  //           });
  //         } else if (
  //           res.response.data.detail.includes("password") ||
  //           res.response.data.detail.includes("Password")
  //         ) {
  //           setErrorsLogin({
  //             ...errorsLogin,
  //             password: res.response.data.detail,
  //           });
  //         } else {
  //           setErrorsLogin({
  //             ...errorsLogin,
  //             email: res.response.data.detail,
  //           });
  //         }
  //       }
  //     })
  //     .finally(() => {
  //       setIsLoadingLogin(false);
  //     });
  // };
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const setLocalStorageData = (data: any) => {
    localStorage.setItem("health_session", data.access_token);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("encoded_mi", data.encoded_mi);
    localStorage.setItem("refresh_token", data.refresh_token);
  };
  const handleDisableBiometric = async () => {
    await secureStorage.clear();
    localStorage.removeItem("biometric_enabled");
    setLocalStorageData(sessionData);

    setPendingCredentials(null);
    setShowBiometricModal(false);

    setTimeout(() => {
      navigate("/");
    }, 500);
  };
  const handleEnableBiometric = async () => {
    if (!pendingCredentials) return;
    setLocalStorageData(sessionData);

    await secureStorage.save(
      pendingCredentials.email,
      pendingCredentials.password,
    );

    localStorage.setItem("biometric_enabled", "true");

    toast({
      title: "Biometric enabled",
      description: "You can now login with biometric.",
    });

    setPendingCredentials(null);
    setShowBiometricModal(false);
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const BiometricModal = () => {
    return (
      <Sheet
        open={showBiometricModal}
        onOpenChange={() => {
          setShowBiometricModal(false);
          navigate("/");
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
        >
          <div className="flex justify-center pb-1 pt-3">
            <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>
          <SheetHeader className="space-y-0 px-5 pb-2 pt-1 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
                {biometryType === BiometryType.faceId ||
                biometryType === BiometryType.faceAuthentication ? (
                  <ScanFace className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Fingerprint className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </span>
              <div>
                <SheetTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Biometric Login
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Allow biometric authentication for faster future logins?
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex gap-2 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
            <Button
              variant="outline"
              onClick={handleDisableBiometric}
              className="h-11 flex-1 rounded-xl border-gray-200 dark:border-gray-700"
            >
              Not now
            </Button>
            <Button
              onClick={handleEnableBiometric}
              className="h-11 flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-medium text-white hover:from-emerald-700 hover:to-teal-700"
            >
              Enable
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  const CallLoginAuthApi = async (
    isRegister = false,
    credentials?: { email: string; password: string },
  ) => {
    setIsLoadingLogin(true);
    // Prefer explicitly passed credentials (critical after register so we don't
    // depend on possibly stale React state).
    const data = {
      email: (credentials?.email || (isRegister ? registerData.email : loginData.email) || "").trim(),
      password: credentials?.password || (isRegister ? registerData.password : loginData.password) || "",
    };

    Auth.login(data.email, data.password)
      .then(async (res) => {
        setSessionData(res.data);
        if (!isRegister) {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });

          const biometricEnabled = localStorage.getItem("biometric_enabled");
          const isAvailable = await biometric.getBiometryType();
          if (biometricEnabled !== "true" && isAvailable) {
            setPendingCredentials({
              email: data.email,
              password: data.password,
            });
            setShowBiometricModal(true);
          } else {
            await secureStorage.save(data.email, data.password);
            setLocalStorageData(res.data);
            setTimeout(() => {
              navigate("/");
            }, 500);
          }
        } else {
          setLocalStorageData(res.data);
          setTimeout(() => {
            navigate("/");
          }, 500);
        }
      })
      .catch((res) => {
        if (isRegister) {
          // Account was created; let the user sign in manually with the same email.
          setLoginData({
            email: data.email,
            password: data.password,
          });
          setCurrentTab("login");
          setRegisterStep(1);
          toast({
            title: "Account created",
            description:
              "Please sign in with the email and password you just registered.",
          });
        }

        if (res.response?.data?.detail) {
          if (
            res.response.data.detail.includes("email") ||
            res.response.data.detail.includes("Email")
          ) {
            setErrorsLogin({ ...errorsLogin, email: res.response.data.detail });
          } else if (
            res.response.data.detail.includes("password") ||
            res.response.data.detail.includes("Password")
          ) {
            setErrorsLogin({
              ...errorsLogin,
              password: res.response.data.detail,
            });
          } else {
            setErrorsLogin({ ...errorsLogin, email: res.response.data.detail });
          }
        }
      })
      .finally(() => {
        setIsLoadingLogin(false);
      });
  };
  const CallRegisterAuthApi = async () => {
    setIsLoadingRegister(true);
    const signupData = {
      email: registerData.email.trim(),
      password: registerData.password,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      gender: registerData.gender,
      dateOfBirth: registerData.dateOfBirth,
      address: registerData.address,
      phone: registerData.phone,
      timeZone: registerData.timeZone,
      photo: photo,
    };
    Auth.signup(signupData)
      .then(() => {
        localStorage.setItem("registerpasswordchange", "true");
        // Pass the same credentials used for register — do not re-read React state.
        CallLoginAuthApi(true, {
          email: signupData.email,
          password: signupData.password,
        });
        toast({
          title: "Account created!",
          description:
            "Welcome to HolistiCare. Let's start monitoring your health.",
        });
      })
      .catch((res) => {
        if (
          res.response.data.detail.includes("email") ||
          res.response.data.detail.includes("Email")
        ) {
          setErrorsRegister({
            ...errorsRegister,
            email: res.response.data.detail,
          });
        } else if (
          res.response.data.detail.includes("password") ||
          res.response.data.detail.includes("Password")
        ) {
          setErrorsRegister({
            ...errorsRegister,
            password: res.response.data.detail,
          });
        } else if (
          res.response.data.detail == "Client must be at least 18 years old."
        ) {
          setRegisterStep(1);
          setErrorsRegister({
            ...errorsRegister,
            dateOfBirth: res.response.data.detail,
          });
        } else if (
          res.response.data.detail.includes("first_name") ||
          res.response.data.detail.includes("First Name")
        ) {
          setErrorsRegister({
            ...errorsRegister,
            firstName: res.response.data.detail,
          });
        } else if (
          res.response.data.detail.includes("last_name") ||
          res.response.data.detail.includes("Last Name")
        ) {
          setErrorsRegister({
            ...errorsRegister,
            lastName: res.response.data.detail,
          });
        } else if (
          res.response.data.detail.includes("phone_number") ||
          res.response.data.detail.includes("phone number")
        ) {
          setRegisterStep(2);
          setErrorsRegister({
            ...errorsRegister,
            phone: res.response.data.detail,
          });
        } else {
          setErrorsRegister({
            ...errorsRegister,
            email: res.response.data.detail,
          });
        }
      })
      .finally(() => {
        setIsLoadingRegister(false);
      });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!loginData.email || loginData.email.trim() === "") &&
      (!loginData.password || loginData.password.trim() === "")
    ) {
      setErrorsLogin({
        ...errorsLogin,
        email: "This field is required.",
        password: "This field is required.",
      });
      return;
    }
    if (!loginData.email || loginData.email.trim() === "") {
      setErrorsLogin({
        ...errorsLogin,
        email: "This field is required.",
      });
      return;
    }
    if (!loginData.password || loginData.password.trim() === "") {
      setErrorsLogin({
        ...errorsLogin,
        password: "This field is required.",
      });
      return;
    }
    if (!validateEmail(loginData.email)) {
      setErrorsLogin({
        ...errorsLogin,
        email: "Invalid email address. Please try again.",
      });
      return;
    }

    // if (loginData.password.length < 6) {
    //   setErrorsLogin({
    //     ...errorsLogin,
    //     password: "Password must be at least 6 characters long",
    //   });
    //   return;
    // }
    CallLoginAuthApi();
  };

  const handleRegisterStepOne = () => {
    if (
      registerData.firstName.trim() === "" ||
      registerData.lastName.trim() === "" ||
      registerData.gender.trim() === "" ||
      registerData.dateOfBirth === null
    ) {
      setErrorsRegister({
        ...errorsRegister,
        firstName: "This field is required.",
        lastName: "This field is required.",
        gender: "This field is required.",
        dateOfBirth: "This field is required.",
      });
      return;
    }
    if (!registerData.firstName || registerData.firstName.trim() === "") {
      setErrorsRegister({
        ...errorsRegister,
        firstName: "This field is required.",
      });
      return;
    }
    if (!registerData.lastName || registerData.lastName.trim() === "") {
      setErrorsRegister({
        ...errorsRegister,
        lastName: "This field is required.",
      });
      return;
    }
    if (!registerData.gender || registerData.gender.trim() === "") {
      setErrorsRegister({
        ...errorsRegister,
        gender: "This field is required.",
      });
      return;
    }
    if (!registerData.dateOfBirth || registerData.dateOfBirth === null) {
      setErrorsRegister({
        ...errorsRegister,
        dateOfBirth: "This field is required.",
      });
      return;
    }
    if (
      errorsRegister.dateOfBirth ||
      errorsRegister.firstName ||
      errorsRegister.lastName ||
      errorsRegister.gender
    ) {
      return;
    }
    setRegisterStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!registerData.email || registerData.email.trim() === "") &&
      (!registerData.password || registerData.password.trim() === "") &&
      (!registerData.confirmPassword ||
        registerData.confirmPassword.trim() === "")
    ) {
      setErrorsRegister({
        ...errorsRegister,
        email: "This field is required.",
        password: "This field is required.",
        confirmPassword: "This field is required.",
      });
      return;
    }
    if (!registerData.email || registerData.email.trim() === "") {
      setErrorsRegister({
        ...errorsRegister,
        email: "This field is required.",
      });
      return;
    }
    if (!registerData.password || registerData.password.trim() === "") {
      setErrorsRegister({
        ...errorsRegister,
        password: "This field is required.",
      });
      return;
    }
    if (
      !registerData.confirmPassword ||
      registerData.confirmPassword.trim() === ""
    ) {
      setErrorsRegister({
        ...errorsRegister,
        confirmPassword: "This field is required.",
      });
      return;
    }
    if (!validateEmail(registerData.email)) {
      setErrorsRegister({
        ...errorsRegister,
        email: "Invalid email address. Please try again.",
      });
      return;
    }
    const passwordValidation = validatePassword(registerData.password);
    if (!passwordValidation.valid) {
      setErrorsRegister({
        ...errorsRegister,
        password: passwordValidation.message || "",
      });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setErrorsRegister({
        ...errorsRegister,
        confirmPassword: "Passwords do not match. Please try again.",
      });
      return;
    }
    if (!registerData.terms) {
      setErrorsRegister({
        ...errorsRegister,
        terms: "You must accept the terms and conditions",
      });
      return;
    }
    CallRegisterAuthApi();
  };

  const handleForgotPasswordSuccess = () => {
    // Switch to login tab after successful password reset
    setCurrentTab("login");
  };

  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);

  useEffect(() => {
    (async () => {
      const type = await biometric.getBiometryType();
      setBiometryType(type);
    })();
  }, []);

  const handleBiometricLogin = async () => {
    const ok = await biometric.authenticate();
    if (!ok) return;

    const creds = await secureStorage.get();
    if (!creds) {
      localStorage.removeItem("biometric_enabled");
      toast({
        title: "No saved credentials",
        description: "Please login first normally",
        variant: "destructive",
      });
      return;
    }

    setLoginData({
      email: creds.email as string,
      password: creds.password as string,
    });

    CallLoginAuthApi(false, {
      email: creds.email as string,
      password: creds.password as string,
    });
  };
  const validateDate = (date: any) => {
    return !isNaN(date.getTime());
  };

  const primaryColor = brandInfo?.primary_color ?? "#10b981";
  const fieldInputClass =
    "h-11 rounded-xl border-gray-200 bg-gray-50/80 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:bg-gray-800/60";
  const fieldLabelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";
  const toggleEyeClass =
    "absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg p-0 text-gray-500 hover:bg-gray-200/70 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/70";
  const primaryBtnStyle = {
    background: primaryColor,
    color: "#ffffff",
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950"
      style={{
        background: `linear-gradient(180deg, ${primaryColor}22 0%, ${primaryColor}08 28%, rgb(249 250 251) 45%)`,
      }}
    >
      <div
        className={`relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] transition-opacity duration-500 ${fadeClass}`}
      >
        {stage === 1 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg ring-1 ring-black/5">
              <img
                src={brandInfo?.logo ?? logoImage}
                alt="HolistiCare Logo"
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {brandInfo?.name ?? "HolistiCare"}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {brandInfo?.headline ?? "Empower Health with Intelligence"}
            </p>
          </div>
        )}

        {stage === 2 && (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg ring-1 ring-black/5">
              <img
                src={brandInfo?.logo ?? logoImage}
                alt="HolistiCare Logo"
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Welcome back
            </h1>
            <p className="mt-2 mb-8 text-sm text-gray-500 dark:text-gray-400">
              Continue your personalized health journey
            </p>
            <Button
              onClick={handleContinue}
              className="h-11 w-full rounded-xl font-medium text-white shadow-sm"
              style={primaryBtnStyle}
            >
              Continue
            </Button>
          </div>
        )}

        {stage === 3 && (
          <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white/95 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/95">
              <div className="px-6 pb-2 pt-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <img
                    src={brandInfo?.logo ?? logoImage}
                    alt="HolistiCare Logo"
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {brandInfo?.name ?? "HolistiCare"}
                </h1>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Sign in or create your account
                </p>
              </div>

              <div className="px-5 pb-6">
                <Tabs
                  value={currentTab}
                  onValueChange={setCurrentTab}
                  className="w-full"
                >
                  <TabsList className="mb-5 grid h-11 w-full grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                    <TabsTrigger
                      value="login"
                      className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100"
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Welcome back! Sign in to continue your health journey.
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="login-email" className={fieldLabelClass}>
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="text"
                        value={loginData.email}
                        onChange={(e) => {
                          setLoginData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }));
                          setErrorsLogin({ ...errorsLogin, email: "" });
                        }}
                        className={fieldInputClass}
                        placeholder="Enter your email"
                      />
                      {errorsLogin.email && (
                        <p className="text-xs text-red-500">{errorsLogin.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="login-password" className={fieldLabelClass}>
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => {
                            setLoginData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }));
                            setErrorsLogin({ ...errorsLogin, password: "" });
                          }}
                          className={`${fieldInputClass} pr-11`}
                          placeholder="Enter your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={toggleEyeClass}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errorsLogin.password && (
                        <p className="text-xs text-red-500">{errorsLogin.password}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                        data-testid="link-forgot-password"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-xl font-medium text-white shadow-sm"
                      style={primaryBtnStyle}
                      disabled={isLoadingLogin}
                      data-testid="button-login"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      {isLoadingLogin ? "Logging in..." : "Log in"}
                    </Button>

                    {biometryType && biometricEnabled && (
                      <div className="flex flex-col items-center pt-2">
                        <Button
                          onClick={handleBiometricLogin}
                          type="button"
                          variant="outline"
                          className="h-14 w-14 rounded-2xl border-gray-200 dark:border-gray-700"
                          title="Login with Biometrics"
                        >
                          {biometryType === BiometryType.faceId ||
                          biometryType === BiometryType.faceAuthentication ? (
                            <ScanFace className="h-7 w-7 text-emerald-600" strokeWidth={1.5} />
                          ) : (
                            <Fingerprint className="h-7 w-7 text-emerald-600" strokeWidth={1.5} />
                          )}
                        </Button>
                        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                          {biometryType === BiometryType.faceId ||
                          biometryType === BiometryType.faceAuthentication
                            ? "Login with Face ID"
                            : "Login with Fingerprint"}
                        </p>
                      </div>
                    )}
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Join HolistiCare and start your personalized health journey.
                  </p>

                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3].map((step) => (
                      <span
                        key={step}
                        className={`h-1.5 rounded-full transition-all ${
                          registerStep === step
                            ? "w-6 bg-emerald-500"
                            : "w-1.5 bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>

                  <div>
                    {registerStep === 1 ? (
                      <>
                        <div className="text-left">
                          <Label
                            htmlFor="register-first-name"
                            className={fieldLabelClass}
                          >
                            First Name
                          </Label>
                          <Input
                            id="register-first-name"
                            type="text"
                            value={registerData.firstName}
                            onChange={(e) => {
                              setRegisterData((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }));
                              setErrorsRegister({
                                ...errorsRegister,
                                firstName: "",
                              });
                            }}
                            className={fieldInputClass}
                            placeholder="Enter your first name"
                          />
                          {errorsRegister.firstName && (
                            <p className="text-red-500 text-xs mt-1">
                              {errorsRegister.firstName}
                            </p>
                          )}
                        </div>
                        <div className="text-left mt-2">
                          <Label
                            htmlFor="register-last-name"
                            className={fieldLabelClass}
                          >
                            Last Name
                          </Label>
                          <Input
                            id="register-last-name"
                            type="text"
                            value={registerData.lastName}
                            onChange={(e) => {
                              setRegisterData((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }));
                              setErrorsRegister({
                                ...errorsRegister,
                                lastName: "",
                              });
                            }}
                            className={fieldInputClass}
                            placeholder="Enter your last name"
                          />
                          {errorsRegister.lastName && (
                            <p className="text-red-500 text-xs mt-1">
                              {errorsRegister.lastName}
                            </p>
                          )}
                        </div>
                        <div className="text-left mt-2">
                          <Label className={fieldLabelClass}>Gender</Label>
                          <Select
                            value={registerData.gender}
                            onValueChange={(value) => {
                              setRegisterData((prev) => ({
                                ...prev,
                                gender: value,
                              }));
                              setErrorsRegister({
                                ...errorsRegister,
                                gender: "",
                              });
                            }}
                          >
                            <SelectTrigger className={fieldInputClass}>
                              <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {errorsRegister.gender && (
                            <p className="text-red-500 text-xs mt-1">
                              {errorsRegister.gender}
                            </p>
                          )}
                        </div>
                        <div className="text-left mt-2">
                          <Label
                            htmlFor="register-date-of-birth"
                            className={fieldLabelClass}
                          >
                            Date of Birth
                          </Label>

                          <SimpleDatePicker
                            placeholder="Select date of birth"
                            isAddClient
                            date={registerData.dateOfBirth}
                            setDate={(date) => {
                              if (validateDate(date)) {
                                setRegisterData((prev) => ({
                                  ...prev,
                                  dateOfBirth: date,
                                }));
                                setErrorsRegister({
                                  ...errorsRegister,
                                  dateOfBirth: "",
                                });
                              }
                            }}
                            inValid={!!errorsRegister.dateOfBirth}
                            errorMessage={errorsRegister.dateOfBirth}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleRegisterStepOne}
                          className="mt-5 h-11 w-full rounded-xl font-medium text-white shadow-sm"
                          style={primaryBtnStyle}
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    ) : registerStep === 2 ? (
                      <>
                        <div className="w-full text-left">
                          <label className={fieldLabelClass}>
                            Phone Number (Optional)
                          </label>
                          <div className="mt-1">
                            <PhoneInput
                              country={"us"}
                              value={registerData.phone}
                              onChange={(value) => {
                                setRegisterData((prev) => ({
                                  ...prev,
                                  phone: value,
                                }));
                                setErrorsRegister({
                                  ...errorsRegister,
                                  phone: "",
                                });
                              }}
                              placeholder="234 567 890"
                              containerClass="custom-phone-input"
                              buttonClass="custom-phone-button"
                              dropdownClass="custom-phone-dropdown"
                              inputProps={{
                                name: "phone",
                                required: false,
                                autoFocus: false,
                              }}
                            />
                          </div>
                          {errorsRegister.phone && (
                            <p className="text-red-500 text-xs mt-1">
                              {errorsRegister.phone}
                            </p>
                          )}
                        </div>

                        {/* Time Zone */}
                        <div className="w-full text-left mt-2">
                          <label className={fieldLabelClass}>
                            Time Zone (Optional)
                          </label>
                          <div className="mt-[3px]">
                            <CustomTimezoneField
                              value={registerData.timeZone}
                              onChange={(tz) => {
                                setRegisterData((prev) => ({
                                  ...prev,
                                  timeZone: tz,
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-left mt-2">
                          <Label
                            htmlFor="register-address"
                            className={fieldLabelClass}
                          >
                            Address (Optional)
                          </Label>
                          <Input
                            id="register-address"
                            type="text"
                            value={registerData.address}
                            onChange={(e) => {
                              setRegisterData((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }));
                            }}
                            className={fieldInputClass}
                            placeholder="Enter your address"
                          />
                        </div>

                        <div className="text-left mt-2">
                          <Label
                            htmlFor="uploadFile"
                            className={fieldLabelClass}
                          >
                            Client’s Photo (Optional)
                          </Label>
                          <div
                            className="relative mt-1 h-[126px] w-full overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/60"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void applySelectedPhoto(e.dataTransfer.files?.[0]);
                            }}
                          >
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="text-center">
                                <div className="mb-2 flex justify-center">
                                  {photo === "" ? (
                                    <img src="icons/upload-test.svg" alt="" />
                                  ) : (
                                    <div className="relative z-20">
                                      <img
                                        className="h-[60px] w-[60px] rounded-full object-cover"
                                        src={photo}
                                        alt="Selected profile"
                                      />
                                      <button
                                        type="button"
                                        aria-label="Remove photo"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          clearSelectedPhoto();
                                        }}
                                        className="absolute right-[-6px] top-[-6px] cursor-pointer rounded-full border border-gray-50 bg-white shadow-200"
                                      >
                                        <img
                                          src="./icons/close.svg"
                                          alt=""
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="text-[12px] text-Text-Primary">
                                  {photo
                                    ? "Photo selected. Tap × to remove."
                                    : "Drag and drop or click to upload."}
                                </div>
                                <div className="mt-2 text-[10px] text-Text-Secondary">
                                  Accepted formats: .png, .jpg. Up to 3 MB.
                                </div>
                              </div>
                            </div>
                            {photo === "" && (
                              <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  void applySelectedPhoto(file);
                                  // Allow selecting the same file again
                                  e.target.value = "";
                                }}
                                id="uploadFile"
                                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                              />
                            )}
                          </div>
                          {photoError && (
                            <div className="mt-1 text-[10px] font-medium text-Red">
                              {photoError}
                            </div>
                          )}
                        </div>
                        <div className="mt-5 flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setRegisterStep(1)}
                            variant="outline"
                            className="h-11 w-11 flex-shrink-0 rounded-xl border-gray-200 p-0 dark:border-gray-700"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!photoError) setRegisterStep(3);
                            }}
                            className="h-11 flex-1 rounded-xl font-medium text-white shadow-sm"
                            style={primaryBtnStyle}
                          >
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <form
                          onSubmit={handleRegister}
                          className={`${registerStep === 3 ? "space-y-4" : ""}`}
                        >
                          <div className="text-left">
                            <Label
                              htmlFor="register-email"
                              className={fieldLabelClass}
                            >
                              Email
                            </Label>
                            <Input
                              id="register-email"
                              type="text"
                              value={registerData.email}
                              onChange={(e) => {
                                setRegisterData((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }));
                                setErrorsRegister({
                                  ...errorsRegister,
                                  email: "",
                                });
                              }}
                              className={fieldInputClass}
                              placeholder="Enter your email"
                            />
                            {errorsRegister.email && (
                              <p className="text-red-500 text-xs mt-1">
                                {errorsRegister.email}
                              </p>
                            )}
                          </div>

                          <div className="text-left">
                            <Label
                              htmlFor="register-password"
                              className={fieldLabelClass}
                            >
                              Password
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                value={registerData.password}
                                onChange={(e) => {
                                  setRegisterData((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                  }));
                                  setErrorsRegister({
                                    ...errorsRegister,
                                    password: "",
                                  });
                                }}
                                className={`${fieldInputClass} pr-11`}
                                placeholder="Create a secure password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={toggleEyeClass}
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {errorsRegister.password && (
                              <p className="text-red-500 text-xs mt-1">
                                {errorsRegister.password}
                              </p>
                            )}
                          </div>

                          <div className="text-left">
                            <Label
                              htmlFor="confirm-password"
                              className={fieldLabelClass}
                            >
                              Confirm Password
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={registerData.confirmPassword}
                                onChange={(e) => {
                                  setRegisterData((prev) => ({
                                    ...prev,
                                    confirmPassword: e.target.value,
                                  }));
                                  setErrorsRegister({
                                    ...errorsRegister,
                                    confirmPassword: "",
                                  });
                                }}
                                className={`${fieldInputClass} pr-11`}
                                placeholder="Confirm your password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={toggleEyeClass}
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {errorsRegister.confirmPassword && (
                              <p className="text-red-500 text-xs mt-1">
                                {errorsRegister.confirmPassword}
                              </p>
                            )}
                          </div>

                          <div className="text-left">
                            <div className="text-left flex items-center gap-2">
                              <Checkbox
                                id="register-terms"
                                checked={registerData.terms}
                                onCheckedChange={() => {
                                  setRegisterData((prev) => ({
                                    ...prev,
                                    terms: !prev.terms,
                                  }));
                                  setErrorsRegister({
                                    ...errorsRegister,
                                    terms: "",
                                  });
                                }}
                                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                              />
                              <Label
                                htmlFor="register-terms"
                                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400"
                              >
                                I accept the{" "}
                                <div
                                  onClick={() => {
                                    void openExternalUrl(
                                      "https://holisticare.io/legal/patients-privacy-policy/",
                                    );
                                  }}
                                  // href="https://holisticare.io/legal/patients-privacy-policy/"
                                  style={{
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                  }}
                                >
                                  Privacy Policy
                                </div>
                                and{" "}
                                <div
                                  onClick={() => {
                                    void openExternalUrl(
                                      "https://holisticare.io/legal/patients-terms-of-service/",
                                    );
                                  }}
                                  // href="https://holisticare.io/legal/patients-terms-of-service/"
                                  style={{
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                  }}
                                >
                                  Terms of Service
                                </div>
                              </Label>
                            </div>
                            {errorsRegister.terms && (
                              <p className="text-red-500 text-xs mt-1">
                                {errorsRegister.terms}
                              </p>
                            )}
                          </div>

                          <div className="mt-6 flex items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => setRegisterStep(2)}
                              variant="outline"
                              className="h-11 w-11 flex-shrink-0 rounded-xl border-gray-200 p-0 dark:border-gray-700"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              type="submit"
                              className="h-11 flex-1 rounded-xl font-medium text-white shadow-sm"
                              style={primaryBtnStyle}
                              disabled={isLoadingRegister}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              {isLoadingRegister
                                ? "Creating account..."
                                : "Create Account"}
                            </Button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        initialEmail={loginData.email}
        onSuccess={handleForgotPasswordSuccess}
      />
      <BiometricModal />
    </div>
  );
}
