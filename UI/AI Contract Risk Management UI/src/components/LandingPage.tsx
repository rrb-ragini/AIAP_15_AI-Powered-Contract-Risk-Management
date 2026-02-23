import { ShieldCheck, FileText, ArrowRight, Lock, Zap, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface LandingPageProps {
    onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
            {/* Navbar */}
            <header style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, backgroundColor: '#2563eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck style={{ width: 22, height: 22, color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.5px' }}>ContractGuard AI</span>
                </div>
                <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500, color: '#4b5563' }}>
                    <a href="#features" style={{ color: '#4b5563', textDecoration: 'none' }}>Features</a>
                    <a href="#how" style={{ color: '#4b5563', textDecoration: 'none' }}>How it Works</a>
                    <a href="#security" style={{ color: '#4b5563', textDecoration: 'none' }}>Security</a>
                </div>
                <Button onClick={onStart} style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: 50, padding: '10px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                    Go to Dashboard <ArrowRight style={{ width: 16, height: 16 }} />
                </Button>
            </header>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 60px', background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 50, padding: '6px 18px', fontSize: 13, fontWeight: 600, color: '#1d4ed8', marginBottom: 32 }}>
                    <Zap style={{ width: 14, height: 14, color: '#d97706' }} />
                    AI-Powered Contract Review
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, color: '#111827', lineHeight: 1.1, maxWidth: 840, margin: '0 auto 24px', letterSpacing: '-1.5px' }}>
                    Identify Contract Risks in{' '}
                    <span style={{ color: '#2563eb' }}>Seconds</span>, Not Hours.
                </h1>
                <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
                    Upload any legal contract and our specialized AI will instantly highlight risky clauses, explain business impacts, and flag missing standard terms — saving your legal team countless hours.
                </p>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button onClick={onStart} style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: 50, padding: '14px 36px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
                        Start Free Analysis <ArrowRight style={{ width: 18, height: 18 }} />
                    </Button>
                    <button style={{ borderRadius: 50, padding: '14px 36px', fontSize: 16, fontWeight: 600, cursor: 'pointer', backgroundColor: '#fff', border: '1.5px solid #d1d5db', color: '#374151' }}>
                        Book a Demo
                    </button>
                </div>

                {/* Stats Banner */}
                <div style={{ marginTop: 64, paddingTop: 48, borderTop: '1px solid #e5e7eb', width: '100%', maxWidth: 800, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                    {[
                        { value: '10k+', label: 'Contracts Analyzed' },
                        { value: '99%', label: 'Clause Accuracy' },
                        { value: '85%', label: 'Time Saved' },
                        { value: 'SOX', label: 'Compliant Storage' },
                    ].map(stat => (
                        <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 32, fontWeight: 800, color: '#111827' }}>{stat.value}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </main>

            {/* Feature Section */}
            <section id="features" style={{ padding: '80px 24px', backgroundColor: '#f9fafb' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Why Legal Teams Choose Us</h2>
                        <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 560, margin: '0 auto' }}>
                            Stop reading hundreds of pages of legalese. Our AI engine is trained on thousands of corporate agreements.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                        {[
                            { icon: <AlertTriangle style={{ width: 24, height: 24, color: '#dc2626' }} />, bg: '#fef2f2', title: 'Instant Risk Spotting', desc: 'Automatically flags unfavorable indemnity clauses, strange termination rights, and aggressive liability caps.' },
                            { icon: <FileText style={{ width: 24, height: 24, color: '#2563eb' }} />, bg: '#eff6ff', title: 'Business Context', desc: 'Translates complex legal jargon directly to business impact categories — Cash Flow, Operational, or Legal risk.' },
                            { icon: <Lock style={{ width: 24, height: 24, color: '#16a34a' }} />, bg: '#f0fdf4', title: 'Enterprise Security', desc: 'Documents are analyzed securely. Your data is never used to train models. Strictly confidential.' },
                        ].map(f => (
                            <Card key={f.title} style={{ border: '1px solid #f3f4f6', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', borderRadius: 16, backgroundColor: '#ffffff' }}>
                                <CardContent style={{ padding: 32 }}>
                                    <div style={{ width: 48, height: 48, backgroundColor: f.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                        {f.icon}
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>{f.title}</h3>
                                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{f.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ backgroundColor: '#111827', padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    <ShieldCheck style={{ width: 20, height: 20, color: '#9ca3af' }} />
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>ContractGuard</span>
                </div>
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                    © {new Date().getFullYear()} ContractGuard AI. Designed for product concept validation.
                </p>
            </footer>
        </div>
    );
}
