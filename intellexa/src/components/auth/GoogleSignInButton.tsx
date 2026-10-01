import { useEffect, useRef } from "react";
import { ApiError } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        hd: string;
      }) => void;
      renderButton: (element: HTMLElement, options: {
        theme: "outline";
        size: "large";
        text: "continue_with";
        shape: "rectangular";
        width: number;
        logo_alignment: "left";
      }) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void>;
  disabled?: boolean;
}

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({ onCredential, disabled = false }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

  onCredentialRef.current = onCredential;
  showToastRef.current = showToast;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let disposed = false;

    const renderGoogleButton = () => {
      const google = window.google;
      const container = containerRef.current;
      if (disposed || !google || !container) return;

      google.accounts.id.initialize({
        client_id: clientId,
        hd: "rajalakshmi.edu.in",
        callback: (response) => {
          if (!response.credential) {
            showToastRef.current("Google sign-in did not return a credential. Please try again.", "error");
            return;
          }
          void onCredentialRef.current(response.credential).catch((error) => {
            showToastRef.current(
              error instanceof ApiError ? error.message : "Google sign-in failed. Please try again.",
              "error",
            );
          });
        },
      });
      container.replaceChildren();
      google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 360,
        logo_alignment: "left",
      });
    };

    if (window.google) {
      renderGoogleButton();
      return () => { disposed = true; };
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const createdScript = !script;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
    }

    const handleLoad = () => renderGoogleButton();
    const handleError = () => {
      if (!disposed) showToastRef.current("Google sign-in could not load. Check your connection and try again.", "error");
    };
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    if (createdScript) document.head.appendChild(script);

    return () => {
      disposed = true;
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="text-center text-xs text-ink-faint" role="status">
        Google sign-in is not configured for this site yet.
      </p>
    );
  }

  return (
    <div
      className={`mx-auto flex min-h-10 w-full max-w-[360px] justify-center overflow-hidden rounded-lg ${disabled ? "pointer-events-none opacity-60" : ""}`}
      aria-busy={disabled}
      aria-disabled={disabled}
    >
      <div ref={containerRef} />
    </div>
  );
}
