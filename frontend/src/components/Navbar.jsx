import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../services/axiosConfig';

const NavLink = ({ to, icon, label, isActive }) => {
    return (
        <li className="nav-item mx-1">
            <Link className={`nav-link text-white px-3 ${isActive ? 'active' : ''}`} to={to}>
                <i className={`bi ${icon} me-1`} /> {label}
            </Link>
        </li>
    );
};

const SignInButton = () => (
    <Link
        to="/login"
        className="btn btn-sm btn-light me-2 px-3"
        style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-primary)',
            border: 'none'
        }}
    >
        <i className="bi bi-box-arrow-in-right me-1" />
        Sign In
    </Link>
);

const RegisterButton = () => (
    <Link
        to="/register"
        className="btn btn-sm btn-outline-light px-3"
        style={{
            borderColor: 'var(--color-bg-primary)',
            color: 'var(--color-bg-primary)'
        }}
    >
        <i className="bi bi-person-plus me-1" />
        Register
    </Link>
);

const LogoutButton = ({ onLogout }) => (
    <button
        className="btn btn-light rounded-pill py-2 px-4 shadow-sm border"
        onClick={onLogout}
        style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-primary)',
            border: 'none'
        }}
    >
        <i className="bi bi-box-arrow-right me-2" />
        Log out
    </button>
);

const AuthButton = ({ isAuthenticated, onLogout }) => {
    if (!isAuthenticated) {
        return (
            <div className="d-flex">
                <SignInButton />
                <RegisterButton />
            </div>
        );
    }
    return <LogoutButton onLogout={onLogout} />;
};

const BrandLogo = () => (
    <Link className="navbar-brand d-flex align-items-center" to="/">
        <img
            src="/grad-logo.png"
            alt="Logo"
            height="32"
            className="me-2"
            onError={(e) => {
                e.target.style.display = 'none';
            }}
        />
        <span className="text-white fw-light" style={{ letterSpacing: '-0.5px' }}>
            <span className="fw-bold">EduTrack</span>
        </span>
    </Link>
);

const MobileMenuButton = ({ isOpen, onClick }) => (
    <button
        className="navbar-toggler border-0 text-white"
        type="button"
        onClick={onClick}
        aria-controls="navbarNav"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-label="Toggle navigation"
        style={{ boxShadow: 'none' }}
    >
        <i className={`bi ${isOpen ? 'bi-x' : 'bi-list'} fs-4`} />
    </button>
);

const NavIndicator = ({ position }) => (
    <div
        className="position-absolute rounded-pill"
        style={{
            height: '3px',
            width: '50px',
            bottom: '0',
            backgroundColor: 'var(--color-secondary)',
            left: position,
            transition: 'left 0.3s ease'
        }}
    />
);

const Navbar = () => {
    const [authStatus, setAuthStatus] = useState({
        authenticated: false,
        isAdmin: false,
        loaded: false
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/api/check-auth');
                setAuthStatus({
                    authenticated: response.data.authenticated,
                    isAdmin: response.data.is_admin,
                    loaded: true
                });
            } catch (error) {
                setAuthStatus({
                    authenticated: false,
                    isAdmin: false,
                    loaded: true
                });
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
            setAuthStatus({
                authenticated: false,
                isAdmin: false,
                loaded: true
            });
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const getNavLinks = () => {
        const links = [
            {
                path: '/',
                icon: 'bi-house',
                label: 'Home',
                show: true
            },
            {
                path: '/application',
                icon: 'bi-file-earmark-text',
                label: 'My Application',
                show: authStatus.authenticated && !authStatus.isAdmin
            },
            {
                path: '/admin/dashboard',
                icon: 'bi-speedometer2',
                label: 'Admin Dashboard',
                show: authStatus.isAdmin
            },
            {
                path: '/admin/manage-users',
                icon: 'bi-people',
                label: 'Manage Users',
                show: authStatus.isAdmin
            },
            {
                path: '/dashboard',
                icon: 'bi-speedometer2',
                label: 'Dashboard',
                show: !authStatus.isAdmin
            }
        ];

        return links
            .filter(link => link.show)
            .map((link, index) => (
                <NavLink
                    key={index}
                    to={link.path}
                    icon={link.icon}
                    label={link.label}
                    isActive={location.pathname === link.path}
                />
            ));
    };

    const getIndicatorPosition = () => {
        const positions = {
            '/': 'calc(50% - 210px)',
            '/dashboard': 'calc(50% - 70px)',
            '/application': 'calc(50% + 70px)',
            '/admin/dashboard': 'calc(50% - 130px)',
            '/admin/manage-users': 'calc(50%)',
            '/admin/settings': 'calc(50% + 130px)'
        };
        return positions[location.pathname] || '-100px';
    };

    return (
        <header>
            <nav
                className="navbar navbar-expand-lg py-3"
                style={{
                    background: 'var(--color-primary)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
            >
                <div className="container">
                    <BrandLogo />
                    <MobileMenuButton
                        isOpen={isMobileMenuOpen}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                    <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`} id="navbarNav">
                        <div className="w-75 ps-5">
                            <ul className="navbar-nav mx-auto">{getNavLinks()}</ul>
                        </div>
                        <div className="d-flex align-items-center mt-3 mt-lg-0">
                            <AuthButton isAuthenticated={authStatus.authenticated} onLogout={handleLogout} />
                        </div>
                    </div>
                </div>
            </nav>
            <div
                className="container position-relative d-none d-lg-block"
                style={{ height: '3px', marginTop: '-3px' }}
            >
                <NavIndicator position={getIndicatorPosition()} />
            </div>
        </header>
    );
};

export default Navbar;