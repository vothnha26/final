import React, { useState, useEffect } from 'react';
import { IoMail, IoArrowBack } from 'react-icons/io5';
import { api } from '../../api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const OtpVerification = () => {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get email from navigation state or URL params
        const stateEmail = location.state?.email;
        if (stateEmail) {
            setEmail(stateEmail);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/api/v1/auth/verify-account', { email: email, otp: otp });
            setSuccess(response);
            // Redirect to login after successful verification
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.data?.message || err.message || 'Xác thực thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) {
            setError('Email không hợp lệ');
            return;
        }

        setResendLoading(true);
        setError('');
        setSuccess('');

        try {
            // Use forgot-password endpoint to generate and send a new OTP to this email
            await api.post('/api/v1/auth/forgot-password', { body: null, query: { email } });
            setSuccess('Mã OTP mới đã được gửi đến email của bạn.');
        } catch (err) {
            setError('Không thể gửi lại mã OTP. Vui lòng thử lại.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                        <IoMail className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Xác thực tài khoản
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Nhập mã OTP đã được gửi đến email của bạn
                    </p>
                    {email && (
                        <p className="mt-1 text-xs text-gray-500">
                            Email: {email}
                        </p>
                    )}
                </div>

                {/* OTP Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                            {success}
                        </div>
                    )}

                    {/* OTP Input */}
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                            Mã OTP
                        </label>
                        <input
                            id="otp"
                            name="otp"
                            type="text"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="block w-full text-center text-2xl tracking-widest py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="000000"
                            maxLength="6"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Mã OTP có 6 chữ số và sẽ hết hạn sau 5 phút
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang xác thực...
                                </div>
                            ) : (
                                'Xác thực tài khoản'
                            )}
                        </button>
                    </div>

                    {/* Resend OTP */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendLoading}
                            className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                        >
                            {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                        </button>
                    </div>

                    {/* Back to Register */}
                    <div className="text-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                        >
                            <IoArrowBack className="h-4 w-4 mr-1" />
                            Quay lại đăng ký
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtpVerification;