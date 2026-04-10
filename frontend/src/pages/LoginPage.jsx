import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Shield, Github, Lock, Scan, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div 
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--app-bg)' }}
    >
      {/* Left Panel - Branding */}
      <div 
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ backgroundColor: 'var(--surface-1)' }}
      >
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(0, 229, 153, 0.08) 0%, transparent 50%)',
            pointerEvents: 'none'
          }}
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border-default) 1px, transparent 1px), 
                              linear-gradient(90deg, var(--border-default) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00D68F 100%)' }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--app-bg)' }} />
            </div>
            <span 
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Depends
            </span>
          </div>

          <div className="max-w-lg">
            <h2 
              className="text-[2.75rem] font-bold mb-6 leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Software Composition<br />
              Analysis
              <span 
                className="block mt-2"
                style={{ color: 'var(--primary)' }}
              >
                Powered by Trivy
              </span>
            </h2>

            <p 
              className="text-lg mb-14 leading-relaxed"
              style={{ color: 'var(--text-body)' }}
            >
              Scan your repositories for vulnerabilities in dependencies, 
              container images, and infrastructure as code. Seamlessly 
              integrate with GitHub Actions.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-5 group">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{ backgroundColor: 'var(--primary-muted)' }}
                >
                  <Scan className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 
                    className="font-semibold mb-1.5 text-[15px]"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    Comprehensive Scanning
                  </h3>
                  <p 
                    className="text-[14px] leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Dependencies, container images, and IaC misconfigurations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{ backgroundColor: 'var(--primary-muted)' }}
                >
                  <Github className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 
                    className="font-semibold mb-1.5 text-[15px]"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    GitHub Integration
                  </h3>
                  <p 
                    className="text-[14px] leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Auto-generate GitHub Actions with real-time webhook results
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{ backgroundColor: 'var(--primary-muted)' }}
                >
                  <Lock className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 
                    className="font-semibold mb-1.5 text-[15px]"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    Severity Tracking
                  </h3>
                  <p 
                    className="text-[14px] leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Critical, High, Medium, Low severity classification with trends
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Powered by Trivy
          </p>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div 
        className="flex-1 flex items-center justify-center p-8"
        style={{ 
          background: 'radial-gradient(ellipse at 70% 30%, rgba(0, 229, 153, 0.04) 0%, var(--app-bg) 60%)'
        }}
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-14 justify-center">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00D68F 100%)' }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--app-bg)' }} />
            </div>
            <span 
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Depends
            </span>
          </div>

          <div 
            className="p-10 rounded-2xl"
            style={{ 
              background: 'linear-gradient(180deg, var(--surface-1) 0%, rgba(10, 20, 16, 0.8) 100%)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h1 
              className="text-2xl font-bold mb-2 text-center tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Welcome back
            </h1>
            <p 
              className="text-center mb-10 text-[14px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Sign in to access your security dashboard
            </p>

            <Button
              onClick={handleLogin}
              className="w-full h-[52px] text-[15px] font-semibold rounded-xl transition-all duration-200"
              style={{ 
                background: 'linear-gradient(180deg, var(--primary) 0%, #00D68F 100%)',
                color: 'var(--app-bg)',
                boxShadow: '0 4px 16px rgba(0, 229, 153, 0.25)'
              }}
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>

            <div 
              className="mt-8 pt-6 border-t text-center"
              style={{ borderColor: 'var(--border-divider)' }}
            >
              <p 
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
