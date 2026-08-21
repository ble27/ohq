import { Link } from 'react-router-dom';

export const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-white text-black">
            <header className="mx-auto flex w-full max-w-[900px] items-center justify-between px-6 py-6">
                <Link to="/" className="text-xl font-semibold tracking-tight hover:opacity-80">
                    Queueble
                </Link>
                <Link to="/" className="text-sm text-gray-600 hover:underline">
                    Back to home
                </Link>
            </header>

            <main className="mx-auto w-full max-w-[900px] px-6 pb-20">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Privacy Policy
                </h1>
                <p className="mt-2 text-sm text-gray-500">Last updated: August 20, 2026</p>

                <div className="mt-10 space-y-8 text-base leading-relaxed text-gray-800">
                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Overview</h2>
                        <p>
                            Queueble (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides office-hour and
                            queue management tools for course TAs and students. This Privacy
                            Policy explains what information we collect, how we use it, and the
                            choices available to you when you use Queueble at{' '}
                            <a href="https://www.queueble.app" className="underline">
                                https://www.queueble.app
                            </a>
                            .
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Information we collect</h2>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>
                                <span className="font-medium">Account information.</span> When you
                                sign in with Google, we receive your Google account identifier,
                                name, and email address so we can create and manage your Queueble
                                account.
                            </li>
                            <li>
                                <span className="font-medium">Usage data.</span> We store
                                application data you create in Queueble, such as courses, queues,
                                queue tickets, and related settings needed to operate the service.
                            </li>
                            <li>
                                <span className="font-medium">Technical data.</span> Like most web
                                apps, our hosting providers may process standard request logs
                                (for example IP address, browser type, and timestamps) to keep
                                the service secure and reliable.
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">How we use information</h2>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>Authenticate you and keep you signed in</li>
                            <li>Provide queue and course features you request</li>
                            <li>Maintain security, prevent abuse, and troubleshoot issues</li>
                            <li>Improve Queueble based on how the product is used</li>
                        </ul>
                        <p>
                            We do not sell your personal information. We do not use Google user
                            data for advertising.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Google user data</h2>
                        <p>
                            Queueble uses Google Sign-In to authenticate users. We only use Google
                            account information (such as your email and basic profile details) to
                            create your Queueble session and identify you inside the app. We do
                            not share Google user data with third parties except as needed to run
                            the service (for example our hosting and database providers) or when
                            required by law.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Data retention and deletion</h2>
                        <p>
                            We retain account and application data for as long as your account is
                            active and as needed to provide Queueble. If you want your account or
                            associated data deleted, contact us using the email below and we will
                            process the request.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Third-party services</h2>
                        <p>
                            Queueble relies on third-party infrastructure to operate, including
                            Google for authentication and our hosting/database providers for
                            application storage and delivery. Those services process data under
                            their own privacy policies.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Children&apos;s privacy</h2>
                        <p>
                            Queueble is intended for university course use and is not directed to
                            children under 13. We do not knowingly collect personal information
                            from children under 13.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Changes to this policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. When we do, we
                            will revise the &quot;Last updated&quot; date at the top of this page.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-black">Contact</h2>
                        <p>
                            Questions about this Privacy Policy or your data can be sent to{' '}
                            <a
                                href="mailto:bryantle2706@outlook.com"
                                className="underline"
                            >
                                bryantle2706@outlook.com
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};
