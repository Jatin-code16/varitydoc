import { useState } from "react";
import logoImg from "../assets/logo.png";
import { 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  FileText, 
  ArrowRight, 
  Zap, 
  Database, 
  CheckCircle2, 
  UserCheck, 
  History, 
  ExternalLink,
  Copy, 
  Check, 
  Upload, 
  Sun, 
  Moon, 
  Laptop,
  Terminal,
  Shield,
  Layers,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function LandingPage({ onLaunchLogin, onLaunchGuest, themePref, setThemePref }) {
  // Interactive Live Hasher state
  const [hasherFile, setHasherFile] = useState(null);
  const [computedHash, setComputedHash] = useState("");
  const [hashing, setHashing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute live client-side SHA-256 hash
  const handleFileDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!file) return;

    setHasherFile(file);
    setHashing(true);
    setComputedHash("");

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      // Artificial 150ms delay for visual feedback
      setTimeout(() => {
        setComputedHash(hashHex);
        setHashing(false);
      }, 150);
    } catch (err) {
      console.error(err);
      setHashing(false);
    }
  };

  const copyHash = () => {
    if (!computedHash) return;
    navigator.clipboard.writeText(computedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landingRoot">
      {/* Sticky Executive Glass Navbar */}
      <header className="landingNavbar">
        <div className="landingNavBrand">
          <img src={logoImg} alt="DocVault Logo" className="landingNavLogo" />
          <div className="landingNavBrandText">
            <span className="landingBrandTitle">DOCVAULT</span>
            <span className="landingBrandTag">ZERO-KNOWLEDGE LEDGER</span>
          </div>
        </div>

        <nav className="landingNavLinks">
          <a href="#features" className="landingNavLink">Architecture</a>
          <a href="#how-it-works" className="landingNavLink">How It Works</a>
          <a href="#hasher" className="landingNavLink">Live Hasher</a>
          <a href="#security" className="landingNavLink">Security & RBAC</a>
        </nav>

        <div className="landingNavActions">
          {/* Theme Switcher */}
          <div className="landingThemeSwitch">
            <button 
              type="button" 
              className={`themePillBtn ${themePref === 'light' ? 'themePillActive' : ''}`}
              onClick={() => setThemePref('light')}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
            <button 
              type="button" 
              className={`themePillBtn ${themePref === 'dark' ? 'themePillActive' : ''}`}
              onClick={() => setThemePref('dark')}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button 
              type="button" 
              className={`themePillBtn ${themePref === 'system' ? 'themePillActive' : ''}`}
              onClick={() => setThemePref('system')}
              title="System Theme"
            >
              <Laptop size={14} />
            </button>
          </div>

          <button 
            type="button" 
            className="landingGuestBtn" 
            onClick={onLaunchGuest}
            title="Instant read-only guest session"
          >
            <span>Explore as Guest</span>
          </button>

          <button 
            type="button" 
            className="landingSignInBtn" 
            onClick={onLaunchLogin}
          >
            <span>Launch Vault</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="landingHero">
        <div className="landingHeroGlow"></div>

        <div className="landingHeroContent">
          {/* Pill Badge */}
          <div className="landingHeroBadge">
            <span className="heroBadgePulse"></span>
            <ShieldCheck size={14} strokeWidth={2.5} />
            <span>SHA-256 + RSA-2048 CRYPTOGRAPHIC VERIFICATION</span>
          </div>

          {/* Main Headline */}
          <h1 className="landingHeroTitle">
            Cryptographic Document <br />
            <span className="heroTitleAccent">Integrity & Verification</span>
          </h1>

          <p className="landingHeroSubtitle">
            Register, sign, and verify documents using SHA-256 hashing and RSA digital signatures. Protect contracts, 
            certifications, and sensitive assets against modification with zero-knowledge cryptographic hashes.
          </p>

          {/* CTA Buttons */}
          <div className="landingHeroCtaGroup">
            <button 
              type="button" 
              className="btnHeroPrimary" 
              onClick={onLaunchLogin}
            >
              <span>Access Secure Vault</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>

            <button 
              type="button" 
              className="btnHeroSecondary" 
              onClick={onLaunchGuest}
            >
              <UserCheck size={18} />
              <span>Instant Guest Mode</span>
            </button>

            <a href="#hasher" className="btnHeroOutline">
              <Zap size={18} />
              <span>Try Live Hasher</span>
            </a>
          </div>

          {/* Trust Matrix Badges */}
          <div className="landingTrustBar">
            <div className="trustItem">
              <CheckCircle2 size={16} className="trustIcon" />
              <span>Zero-Knowledge Proofs</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={16} className="trustIcon" />
              <span>SHA-256 Hash Verification</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={16} className="trustIcon" />
              <span>Fast Client-Side Verification</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={16} className="trustIcon" />
              <span>Role-Based Access Control</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Mockup Terminal */}
        <div className="landingHeroGraphic">
          <div className="heroTerminalCard">
            <div className="terminalHeader">
              <div className="terminalButtons">
                <span className="termBtn termBtnRed"></span>
                <span className="termBtn termBtnYellow"></span>
                <span className="termBtn termBtnGreen"></span>
              </div>
              <span className="terminalTitle">NODE // DOCVAULT_INTEGRITY_ENGINE</span>
              <span className="terminalActiveBadge">TLS 1.3 SECURE</span>
            </div>

            <div className="terminalBody">
              <div className="termCodeLine">
                <span className="termPrompt">$</span>
                <span className="termCmd">docvault verify --file confidential_agreement.pdf</span>
              </div>
              <div className="termOutputBlock">
                <div className="termLog">[1] COMPUTING CANONICAL SHA-256 DIGEST...</div>
                <div className="termLogHash">
                  SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </div>
                <div className="termLog">[2] QUERYING DOCUMENT REGISTRY...</div>
                <div className="termLog">[3] VALIDATING RSA DIGITAL SIGNATURE...</div>
              </div>

              {/* Status Certificate Banner */}
              <div className="terminalVerdictBanner">
                <div className="verdictIconWrap">
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <div className="verdictText">
                  <div className="verdictHeading">DOCUMENT INTEGRITY VERIFIED (100% AUTHENTIC)</div>
                  <div className="verdictSub">
                    Zero tampering detected • Anchored at timestamp 2026-09-29T10:45:00Z
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE HASHER WORKING DEMO */}
      <section id="hasher" className="landingSection hasherSection">
        <div className="sectionHeader">
          <div className="sectionBadge">
            <Zap size={14} />
            <span>INSTANT DEMONSTRATION</span>
          </div>
          <h2 className="sectionTitle">Client-Side Zero-Knowledge Hasher</h2>
          <p className="sectionDesc">
            Test our cryptographic hashing engine right now. Drop any file below: the hash is computed 
            <strong> 100% inside your browser</strong> via the Web Crypto API. Your file is never uploaded.
          </p>
        </div>

        <div className="hasherContainer">
          <label 
            className="hasherDropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input 
              type="file" 
              className="hasherFileInput" 
              onChange={handleFileDrop} 
            />
            <div className="hasherDropContent">
              <div className="hasherDropIconWrap">
                <Upload size={32} />
              </div>
              <div className="hasherDropTexts">
                <span className="dropTitle">
                  {hasherFile ? hasherFile.name : "Drag & drop any file here, or click to browse"}
                </span>
                <span className="dropSub">
                  {hasherFile ? `${(hasherFile.size / 1024).toFixed(1)} KB • Ready for cryptographic analysis` : "PDF, Images, Contracts, Source Code, ZIP (Processed entirely in-memory)"}
                </span>
              </div>
            </div>
          </label>

          {hashing && (
            <div className="hasherProcessing">
              <span className="spinner"></span>
              <span>Digesting byte stream into SHA-256 hash...</span>
            </div>
          )}

          {computedHash && !hashing && (
            <div className="hasherResultCard">
              <div className="hasherResultTop">
                <div className="hasherResultLabelGroup">
                  <Fingerprint size={16} />
                  <span>COMPUTED SHA-256 HASH DIGEST</span>
                </div>
                <button 
                  type="button" 
                  className={`btnCopyHash ${copied ? 'btnCopySuccess' : ''}`}
                  onClick={copyHash}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy Hash"}</span>
                </button>
              </div>

              <code className="hasherResultCode">{computedHash}</code>

              <div className="hasherResultActions">
                <span className="hasherIntegrityProof">
                  <ShieldCheck size={14} />
                  Mathematical fingerprint generated without transferring file contents.
                </span>

                <button 
                  type="button" 
                  className="btnVerifyInVault"
                  onClick={onLaunchGuest}
                >
                  <span>Verify in DocVault Ledger</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CORE PILLARS / FEATURES */}
      <section id="features" className="landingSection">
        <div className="sectionHeader">
          <div className="sectionBadge">
            <Layers size={14} />
            <span>CORE ARCHITECTURE</span>
          </div>
          <h2 className="sectionTitle">Engineered for Cryptographic Document Verification</h2>
          <p className="sectionDesc">
            DocVault protects document authenticity with client-side hashing and digital signature verification.
          </p>
        </div>

        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIconWrap featureIconGreen">
              <Fingerprint size={26} />
            </div>
            <h3 className="featureCardTitle">Cryptographic Integrity</h3>
            <p className="featureCardDesc">
              Files are digested using SHA-256 into a unique 64-character hexadecimal fingerprint. Changing even a single whitespace or punctuation flips the entire hash avalanche.
            </p>
            <div className="featureCardFooter">
              <code>SHA-256 Collision Resistant</code>
            </div>
          </div>

          <div className="featureCard">
            <div className="featureIconWrap featureIconBlue">
              <Lock size={26} />
            </div>
            <h3 className="featureCardTitle">Asymmetric Signatures</h3>
            <p className="featureCardDesc">
              Documents are signed using a configured RSA signing key. Verification checks the signature against the document digest and confirms the associated application user.
            </p>
            <div className="featureCardFooter">
              <code>RSA-2048 / RS256 Verification</code>
            </div>
          </div>

          <div className="featureCard">
            <div className="featureIconWrap featureIconRed">
              <History size={26} />
            </div>
            <h3 className="featureCardTitle">Append-Oriented Audit Trail</h3>
            <p className="featureCardDesc">
              Every registration, integrity verification, and access event is recorded into an audit log with UTC timestamps for transparent operational tracking.
            </p>
            <div className="featureCardFooter">
              <code>Audit Event Logging</code>
            </div>
          </div>

          <div className="featureCard">
            <div className="featureIconWrap featureIconPurple">
              <UserCheck size={26} />
            </div>
            <h3 className="featureCardTitle">Role-Based Access Control</h3>
            <p className="featureCardDesc">
              Granular identity claims enforcing least-privilege security for System Administrators, Document Owners, Independent Auditors, and Public Guests.
            </p>
            <div className="featureCardFooter">
              <code>4-Tier RBAC Claims Matrix</code>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="landingSection howItWorksSection">
        <div className="sectionHeader">
          <div className="sectionBadge">
            <Terminal size={14} />
            <span>OPERATIONAL WORKFLOW</span>
          </div>
          <h2 className="sectionTitle">Three Steps to Document Verification</h2>
          <p className="sectionDesc">
            A straightforward workflow designed for teams, auditors, developers, and institutions.
          </p>
        </div>

        <div className="workflowSteps">
          <div className="stepCard">
            <div className="stepNumber">01</div>
            <h4 className="stepTitle">Client-Side Ingestion</h4>
            <p className="stepDesc">
              Drop any contract, certificate, or image. The cryptographic hash is computed directly in your browser. Your confidential file never leaves your device unencrypted.
            </p>
          </div>

          <div className="stepCardArrow">
            <ChevronRight size={28} />
          </div>

          <div className="stepCard">
            <div className="stepNumber">02</div>
            <h4 className="stepTitle">Document Registration</h4>
            <p className="stepDesc">
              The cryptographic fingerprint, registrar identity, and digital signature metadata are stored in the document verification registry.
            </p>
          </div>

          <div className="stepCardArrow">
            <ChevronRight size={28} />
          </div>

          <div className="stepCard">
            <div className="stepNumber">03</div>
            <h4 className="stepTitle">Instant Verification</h4>
            <p className="stepDesc">
              Any recipient or auditor can drop the file to verify its authenticity. If even 1 bit was altered, DocVault immediately alerts with the hash mismatch.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM HERO CTA */}
      <section className="landingBottomCta">
        <div className="bottomCtaCard">
          <div className="bottomCtaBadge">
            <ShieldCheck size={16} />
            <span>SECURE DOCUMENT REPOSITORY</span>
          </div>
          <h2 className="bottomCtaTitle">Ready to Secure Your Critical Documents?</h2>
          <p className="bottomCtaSubtitle">
            Start registering and verifying documents with cryptographic integrity and digital signatures.
          </p>

          <div className="bottomCtaActions">
            <button 
              type="button" 
              className="btnHeroPrimary" 
              onClick={onLaunchLogin}
            >
              <span>Launch DocVault System</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
            <button 
              type="button" 
              className="btnHeroSecondary" 
              onClick={onLaunchGuest}
            >
              <UserCheck size={18} />
              <span>Explore as Guest</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landingFooter">
        <div className="landingFooterMain">
          <div className="footerBrandBlock">
            <div className="footerBrandLogo">
              <img src={logoImg} alt="DocVault" />
              <span>DOCVAULT</span>
            </div>
            <p className="footerBrandDesc">
              High-assurance zero-knowledge document registration and cryptographic integrity ledger.
            </p>
          </div>

          <div className="footerLinksBlock">
            <span className="footerLinksHeader">NAVIGATION</span>
            <a href="#features">Architecture</a>
            <a href="#how-it-works">Workflow</a>
            <a href="#hasher">Live Hasher</a>
          </div>

          <div className="footerLinksBlock">
            <span className="footerLinksHeader">SECURITY</span>
            <span>SHA-256 Digests</span>
            <span>RSA-2048 / RS256 Signatures</span>
            <span>TLS 1.3 Encrypted</span>
          </div>

          <div className="footerLinksBlock">
            <span className="footerLinksHeader">SYSTEM TELEMETRY</span>
            <div className="footerStatusPulse">
              <span className="footerPulseDot"></span>
              <span>All Systems Operational</span>
            </div>
            <span className="footerVersionText">DocVault v2.4 Enterprise</span>
          </div>
        </div>

        <div className="landingFooterBottom">
          <span>&copy; {new Date().getFullYear()} DocVault Cryptographic Registry. All rights reserved.</span>
          <div className="footerBottomLinks">
            <a href="https://github.com/Jatin-code16/varitydoc" target="_blank" rel="noreferrer">
              <span>GitHub Repository</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
