import NavbarTeacher from "../components/NavbarTeacher";

const TeacherLayout = ({ children }) => {
    return (
        <div className="min-h-screen font-sans text-gray-900 bg-gray-10">
            {/* Navbar luôn hiển thị */}
            <NavbarTeacher />

            {/* Main Content Wrapper */}
            {/* pt-20 để bù cho chiều cao của Navbar (h-16) + khoảng cách */}
            <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;