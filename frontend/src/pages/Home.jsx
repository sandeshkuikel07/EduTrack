import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/axiosConfig';

const Home = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async() => {
            try {
                const response = await axios.get('/api/check-auth');
                if (response.data.authenticated) {
                    setUser({
                        id: response.data.user_id,
                        isAdmin: response.data.is_admin
                    });
                }
            } catch (error) {
                console.error('Error checking auth status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const renderAuthButtons = () => {
        if (loading) return null;

        if (user) {
            return ( <
                div className = "d-flex flex-wrap gap-3" > {
                    user.isAdmin ? ( <
                        Link to = "/admin/dashboard"
                        className = "btn btn-primary px-4 py-2" >
                        Admin Dashboard <
                        /Link>
                    ) : ( <
                        Link to = "/application"
                        className = "btn btn-primary px-4 py-2" >
                        My Application <
                        /Link>
                    )
                } <
                /div>
            );
        }

        return ( <
            div className = "d-flex flex-wrap gap-3" >
            <
            Link to = "/register"
            className = "btn btn-primary px-4 py-2" >
            Register <
            /Link> <
            Link to = "/login"
            className = "btn btn-outline-secondary px-4 py-2"
            style = {
                {
                    borderColor: 'var(--color-secondary)',
                    color: 'var(--color-secondary)'
                }
            } >
            Login <
            /Link> < /
            div >
        );
    };

    const renderFeatures = () => ( <
        div className = "position-relative" >
        <
        div className = "position-absolute top-0 start-0 w-100 h-100"
        style = {
            {
                background: 'var(--color-primary)',
                opacity: 0.1,
                borderRadius: '20px',
                transform: 'rotate(-3deg)'
            }
        }
        /> <
        div className = "position-relative bg-white p-4 rounded-4 shadow-sm"
        style = {
            {
                border: '1px solid rgba(0,0,0,0.05)'
            }
        } >
        <
        div className = "d-flex align-items-center mb-4" >
        <
        div className = "rounded-circle p-3 me-3"
        style = {
            { backgroundColor: 'var(--color-primary-light)' }
        } >
        <
        i className = "bi bi-mortarboard-fill fs-4"
        style = {
            { color: 'var(--color-primary)' }
        }
        /> < /
        div > <
        div >
        <
        h3 className = "h5 mb-1"
        style = {
            { color: 'var(--color-primary)' }
        } >
        Higher Education <
        /h3> <
        p className = "text-muted mb-0" > Track your academic journey < /p> < /
        div > <
        /div> <
        div className = "d-flex align-items-center mb-4" >
        <
        div className = "rounded-circle p-3 me-3"
        style = {
            { backgroundColor: 'var(--color-secondary-light)' }
        } >
        <
        i className = "bi bi-graph-up fs-4"
        style = {
            { color: 'var(--color-secondary)' }
        }
        /> < /
        div > <
        div >
        <
        h3 className = "h5 mb-1"
        style = {
            { color: 'var(--color-secondary)' }
        } >
        Progress Tracking <
        /h3> <
        p className = "text-muted mb-0" > Monitor your application status < /p> < /
        div > <
        /div> <
        div className = "d-flex align-items-center" >
        <
        div className = "rounded-circle p-3 me-3"
        style = {
            { backgroundColor: 'var(--color-primary-light)' }
        } >
        <
        i className = "bi bi-check-circle-fill fs-4"
        style = {
            { color: 'var(--color-primary)' }
        }
        /> < /
        div > <
        div >
        <
        h3 className = "h5 mb-1"
        style = {
            { color: 'var(--color-primary)' }
        } >
        Easy Management <
        /h3> <
        p className = "text-muted mb-0" > Streamlined application process < /p> < /
        div > <
        /div> < /
        div > <
        /div>
    );

    return ( <
        div className = "min-vh-100 d-flex flex-column" >
        <
        section className = "py-5 flex-grow-1 d-flex align-items-center"
        style = {
            {
                background: 'var(--color-bg-primary)',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }
        } >
        <
        div className = "container" >
        <
        div className = "row align-items-center" >
        <
        div className = "col-lg-6 mb-5 mb-lg-0" >
        <
        h1 className = "display-4 fw-light mb-3"
        style = {
            {
                color: 'var(--color-primary)',
                letterSpacing: '-0.5px'
            }
        } >
        Higher Applicant <
        br / >
        <
        span className = "fw-bold" > Studies System < /span> < /
        h1 >

        <
        p className = "lead text-muted mb-4" >
        A refined application experience
        for higher education programs. <
        /p>

        { renderAuthButtons() } <
        /div> <
        div className = "col-lg-6" > { renderFeatures() } <
        /div> < /
        div > <
        /div> < /
        section >

        {!loading && !user && ( <
                section className = "py-5"
                style = {
                    { backgroundColor: 'var(--color-primary-dark)' }
                } >
                <
                div className = "container text-center" >
                <
                h2 className = "h3 fw-light mb-4 text-white" >
                Begin your academic journey today <
                /h2> <
                Link to = "/register"
                className = "btn btn-light px-5 py-2"
                style = {
                    {
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-primary)',
                        border: 'none'
                    }
                } >
                Get Started <
                /Link> < /
                div > <
                /section>
            )
        }

        <
        footer className = "py-4"
        style = {
            { backgroundColor: 'var(--color-bg-secondary)' }
        } >
        <
        div className = "container" >
        <
        div className = "d-flex justify-content-center align-items-center" >
        <
        span className = "text-muted small" > ©2025 Higher Applicant Studies System <
        /span> < /
        div > <
        /div> < /
        footer > <
        /div>
    );
};

export default Home;