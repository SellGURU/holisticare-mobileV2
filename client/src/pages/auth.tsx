import Auth from "@/api/auth";
import ForgotPasswordModal from "@/components/auth/forgot-password-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { validateEmail, validatePassword } from "@/lib/utils";
import { biometric } from "@/services/biometric";
import { secureStorage } from "@/services/secureStorage";
import { BiometryType } from "@aparajita/capacitor-biometric-auth";
import {
  Eye,
  EyeOff,
  Fingerprint,
  LogIn,
  ScanFace,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
// import logoImage from "@assets/logo.png";

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
  });
  const [stage, setStage] = useState(1);
  const [fadeClass, setFadeClass] = useState("opacity-100");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTab, setCurrentTab] = useState("login");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

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
    last_update: string;
    logo: string;
    name: string;
    headline: string;
    primary_color: string;
    secondary_color: string;
    tone: string;
    focus_area: string;
  }>();

  useEffect(() => {
    const storedBrandInfo = localStorage.getItem("brand_info");
    if (storedBrandInfo) {
      try {
        const parsedInfo = JSON.parse(storedBrandInfo);
        setBrandInfo(parsedInfo);
      } catch (error) {
        console.error("Error parsing brand_info from localStorage:", error);
      }
    }
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
      pendingCredentials.password
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
      <Dialog
        open={showBiometricModal}
        onOpenChange={() => {
          setShowBiometricModal(false);
          navigate("/");
        }}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔐 Biometric Login
            </DialogTitle>
            <DialogDescription>
              Do you allow us to use biometric authentication for future logins?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-end flex-nowrap">
            <Button variant="outline" onClick={handleDisableBiometric}>
              Not now
            </Button>
            <Button onClick={handleEnableBiometric}>Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const CallLoginAuthApi = async (
    isRegister = false,
    credentials?: { email: string; password: string }
  ) => {
    setIsLoadingLogin(true);
    const data = {
      email: credentials?.email || loginData.email,
      password: credentials?.password || loginData.password,
    };
    if (isRegister) {
      data.email = registerData.email;
      data.password = registerData.password;
    }

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
    Auth.signup(registerData.email, registerData.password)
      .then(() => {
        localStorage.setItem("registerpasswordchange", "true");
        CallLoginAuthApi(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-300 to-green-400 relative overflow-hidden">
      {/* Curved bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 400 120"
          className="w-full h-24 pointer-events-none -z-10"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 Q100,20 200,60 T400,60 L400,120 L0,120 Z"
            fill="rgba(255,255,255,0.1)"
          />
          <path
            d="M0,80 Q150,40 300,80 T400,80 L400,120 L0,120 Z"
            fill="rgba(255,255,255,0.05)"
          />
        </svg>
      </div>

      {/* Content */}
      <div
        className={`flex flex-col items-center justify-center min-h-screen px-4 sm:px-8 pt-16 pb-8 transition-opacity duration-500 relative z-10 ${fadeClass}`}
      >
        {/* Stage 1: Loading with HolistiCare.io */}
        {stage === 1 && (
          <div className="text-center">
            {/* Logo circle */}
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
              <img
                src={brandInfo ? brandInfo?.logo : logoImage}
                alt="HolistiCare Logo"
                className="w-12 h-12"
              />
            </div>

            <h1 className="text-white text-2xl font-bold mb-2">
              {brandInfo
                ? brandInfo?.name || "HolistiCare.io"
                : "HolistiCare.io"}
            </h1>
            <p className="text-white/90 text-sm">
              {brandInfo
                ? brandInfo?.headline || "Empower Health with Intelligence"
                : "Empower Health with Intelligence"}
            </p>
          </div>
        )}

        {/* Stage 2: Welcome screen */}
        {stage === 2 && (
          <div className="text-center w-full">
            {/* Logo circle */}
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
              <img
                src={brandInfo ? brandInfo?.logo : logoImage}
                alt="HolistiCare Logo"
                className="w-12 h-12"
              />
            </div>

            <h1 className="text-white text-xl font-bold mb-2">
              {brandInfo ? brandInfo?.name || "HolistiCare" : "HolistiCare"}
            </h1>
            <p className="text-white/90 text-sm mb-8 sm:mb-12">
              Welcome back to your health journey
            </p>

            <Button
              onClick={handleContinue}
              className="w-full bg-white text-green-600 hover:bg-white/90 font-semibold py-4 rounded-full max-w-xs mx-auto"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Stage 3: Auth forms */}
        {stage === 3 && (
          <div className="text-center w-full">
            {/* Logo circle */}
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
              <img
                src={brandInfo ? brandInfo?.logo : logoImage}
                alt="HolistiCare Logo"
                className="w-12 h-12"
              />
            </div>

            <h1 className="text-white text-xl font-bold mb-6">
              {brandInfo ? brandInfo?.name || "HolistiCare" : "HolistiCare"}
            </h1>

            <div className="w-full max-w-xs mx-auto">
              <Tabs
                value={currentTab}
                onValueChange={setCurrentTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-white/20 mb-6">
                  <TabsTrigger
                    value="login"
                    className="text-white data-[state=active]:bg-white data-[state=active]:text-green-600"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="text-white data-[state=active]:bg-white data-[state=active]:text-green-600"
                  >
                    Create Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <p className="text-white/90 text-sm mb-6 sm:mb-8 px-2 sm:px-4 text-center">
                    Welcome back! Enter your email and password to continue your
                    health journey.
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="text-left">
                      <Label
                        htmlFor="login-email"
                        className="text-white text-sm"
                      >
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
                          setErrorsLogin({
                            ...errorsLogin,
                            email: "",
                          });
                        }}
                        className="mt-1 bg-green-200 border-0 text-gray-700 placeholder-gray-500 rounded-lg"
                        placeholder="Enter your email"
                      />
                      {errorsLogin.email && (
                        <p className="text-red-500 text-[11px] mt-1">
                          {errorsLogin.email}
                        </p>
                      )}
                    </div>

                    <div className="text-left">
                      <Label
                        htmlFor="login-password"
                        className="text-white text-sm"
                      >
                        Password
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => {
                            setLoginData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }));
                            setErrorsLogin({
                              ...errorsLogin,
                              password: "",
                            });
                          }}
                          className="bg-green-200 border-0 text-gray-700 placeholder-gray-500 rounded-lg pr-10"
                          placeholder="Enter your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-600 hover:bg-transparent"
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
                        <p className="text-red-500 text-[11px] mt-1">
                          {errorsLogin.password}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-white text-sm hover:underline"
                        data-testid="link-forgot-password"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white text-green-600 hover:bg-white/90 font-semibold py-4 rounded-full mt-6 cursor-pointer"
                      disabled={isLoadingLogin}
                      data-testid="button-login"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {isLoadingLogin ? "Logging in..." : "Log in"}
                    </Button>
                    <div className="flex flex-col items-center">
                      {biometryType && biometricEnabled && (
                        <div className="flex justify-center">
                          <Button
                            onClick={handleBiometricLogin}
                            variant="outline"
                            className="rounded-full p-4 h-16 w-16 border-2 border-primary/50 hover:bg-primary/10 transition-all"
                            title="Login with Biometrics"
                          >
                            {biometryType === BiometryType.faceId ||
                            biometryType === BiometryType.faceAuthentication ? (
                              <ScanFace
                                className="h-8 w-8 text-primary"
                                strokeWidth={1.5}
                              />
                            ) : (
                              <Fingerprint
                                className="h-8 w-8 text-primary"
                                strokeWidth={1.5}
                              />
                            )}
                          </Button>
                        </div>
                      )}
                      {biometryType && biometricEnabled && (
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          {biometryType === BiometryType.faceId ||
                          biometryType === BiometryType.faceAuthentication
                            ? "Login with Face Recognition"
                            : "Login with Fingerprint"}
                        </p>
                      )}
                    </div>
                  </form>

                  {/* Test credentials button */}
                  {/* <Button
                    type="button"
                    onClick={fillTestCredentials}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-full mt-4"
                  >
                    Fill Test Credentials
                  </Button> */}
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <p className="text-white/90 text-sm mb-6 sm:mb-8 px-2 sm:px-4 text-center">
                    Join HolistiCare and start your personalized health journey
                    today.
                  </p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="text-left">
                      <Label
                        htmlFor="register-email"
                        className="text-white text-sm"
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
                        className="mt-1 bg-green-200 border-0 text-gray-700 placeholder-gray-500 rounded-lg"
                        placeholder="Enter your email"
                      />
                      {errorsRegister.email && (
                        <p className="text-red-500 text-[11px] mt-1">
                          {errorsRegister.email}
                        </p>
                      )}
                    </div>

                    <div className="text-left">
                      <Label
                        htmlFor="register-password"
                        className="text-white text-sm"
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
                          className="bg-green-200 border-0 text-gray-700 placeholder-gray-500 rounded-lg pr-10"
                          placeholder="Create a secure password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-600 hover:bg-transparent"
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
                        <p className="text-red-500 text-[11px] mt-1">
                          {errorsRegister.password}
                        </p>
                      )}
                    </div>

                    <div className="text-left">
                      <Label
                        htmlFor="confirm-password"
                        className="text-white text-sm"
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
                          className="bg-green-200 border-0 text-gray-700 placeholder-gray-500 rounded-lg pr-10"
                          placeholder="Confirm your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-600 hover:bg-transparent"
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
                        <p className="text-red-500 text-[11px] mt-1">
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
                          className="data-[state=checked]:bg-green-700 data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor="register-terms"
                          className="text-white text-xs flex items-center gap-1 text-nowrap"
                        >
                          I accept the{" "}
                          <div
                            onClick={() => {
                              window.open(
                                "https://holisticare.io/legal/patients-privacy-policy/",
                                "_blank"
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
                              window.open(
                                "https://holisticare.io/legal/patients-terms-of-service/",
                                "_blank"
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
                        <p className="text-red-500 text-[11px] mt-1">
                          {errorsRegister.terms}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white text-green-600 hover:bg-white/90 font-semibold py-4 rounded-full mt-6 cursor-pointer"
                      disabled={isLoadingRegister}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isLoadingRegister
                        ? "Creating account..."
                        : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
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
