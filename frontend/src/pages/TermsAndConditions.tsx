import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">I. Data Privacy &amp; Consent</h1>

                <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">English:</h2>
                        <p>
                            Filling up this form authorizes the Science and Technology Information Institute (DOST-STII)
                            to collect, store, and access any personal data you may disclose herein. Such information
                            encompasses, but is not limited to, your name, contact number, email address, and sex. This
                            data shall be kept private and confidential, and may be processed and used only for the
                            fulfillment of DOST-STII&apos;s mandates subject to the Data Privacy Act and other relevant laws.
                        </p>
                    </section>

                    <p className="italic text-gray-600">
                        For data privacy concerns and/or feedback regarding this notice, you can email us at
                        {' '}feedback@stii.dost.gov.ph
                    </p>

                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Filipino:</h2>
                        <p>
                            Sa pagsagot ng sarbey na ito, pinahihintulutan ang Science and Technology Information
                            Institute (DOST-STII) na kolektahin, itago, at gamitin ang personal na datos na iyong
                            inihayag. Ang nasabing impormasyon ay sumasaklaw, ngunit hindi limitado sa, iyong pangalan,
                            numero, email address, at kasarian. Ang datos na ito ay pananatilihing pribado at
                            kumpidensyal, at maaaring iproseso at gamitin lamang para sa pag tupad sa mga mandato ng
                            DOST-STII na napapailalim sa Data Privacy Act at iba pang nauugnay na batas.
                        </p>
                    </section>

                    <p className="italic text-gray-600">
                        Para sa mga alalahanin sa privacy ng datos at feedback hinggil sa pahayag na ito, maaari kang
                        sumulat sa amin sa email na ito: feedback@stii.dost.gov.ph
                    </p>

                    <p className="text-red-700 font-medium">
                        * I hereby acknowledge that I am fully informed of the foregoing and that I consent to the
                        collection and processing of my Personal Data by DOST-STII.
                    </p>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Last updated: April 1, 2026</p>
                    <Link to="/" className="text-sm text-[#1E74BC] hover:underline font-medium">
                        Back to Login / Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
