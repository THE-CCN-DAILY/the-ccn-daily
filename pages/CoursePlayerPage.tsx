import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, getDocs, orderBy, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeftIcon, CheckIcon, PlayIcon, SpeakerWaveIcon } from '../components/icons';
import Card from '../components/Card';
import Markdown from 'react-markdown';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  coverUrl?: string;
  isPremium?: boolean;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  audioUrl?: string;
  order: number;
}

const CoursePlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!courseId || !user) return;

    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        
        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
        }

        // Fetch user progress
        const progressRef = doc(db, `users/${user.uid}/courseProgress`, courseId);
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          setCompletedModules(progressSnap.data().completedModules || []);
        }

        // Fetch modules
        const modulesQuery = query(collection(db, `courses/${courseId}/modules`), orderBy('order', 'asc'));
        const modulesSnap = await getDocs(modulesQuery);
        const fetchedModules: CourseModule[] = [];
        modulesSnap.forEach((doc) => {
          fetchedModules.push({ id: doc.id, ...doc.data() } as CourseModule);
        });
        setModules(fetchedModules);

        if (fetchedModules.length > 0) {
          // Find first uncompleted module, or just the first module
          const firstUncompleted = fetchedModules.find(m => !progressSnap.exists() || !(progressSnap.data().completedModules || []).includes(m.id));
          setActiveModuleId(firstUncompleted ? firstUncompleted.id : fetchedModules[0].id);
        }

      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  const handleMarkComplete = async (moduleId: string) => {
    if (!courseId || !user || completedModules.includes(moduleId)) return;
    setCompleting(true);

    try {
      const progressRef = doc(db, `users/${user.uid}/courseProgress`, courseId);
      const progressSnap = await getDoc(progressRef);
      
      if (!progressSnap.exists()) {
        await setDoc(progressRef, {
          completedModules: [moduleId],
          lastAccessed: new Date()
        });
      } else {
        await updateDoc(progressRef, {
          completedModules: arrayUnion(moduleId),
          lastAccessed: new Date()
        });
      }
      
      setCompletedModules(prev => [...prev, moduleId]);
      
      // Auto-advance to next module if available
      const currentIndex = modules.findIndex(m => m.id === moduleId);
      if (currentIndex < modules.length - 1) {
        setActiveModuleId(modules[currentIndex + 1].id);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Course Not Found</h2>
        <button onClick={() => navigate('/app/courses')} className="text-brand-accent hover:underline">
          Return to Courses
        </button>
      </div>
    );
  }

  const activeModule = modules.find(m => m.id === activeModuleId);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate('/app/courses')}
        className="flex items-center text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Courses
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1">
          {activeModule ? (
            <>
              {activeModule.videoUrl ? (
                <Card className="p-0 overflow-hidden border-brand-border bg-brand-dark/30 mb-6">
                  <div className="aspect-video bg-black flex items-center justify-center relative group">
                    <video 
                      src={activeModule.videoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                      poster={course.coverUrl}
                    />
                  </div>
                </Card>
              ) : activeModule.audioUrl ? (
                <Card className="border-brand-border bg-brand-dark/30 mb-6 flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                    <SpeakerWaveIcon className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-brand-text-primary mb-2">Listen to {activeModule.title}</h3>
                    <audio controls className="w-full h-10" src={activeModule.audioUrl} />
                  </div>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden border-brand-border bg-brand-dark/30 mb-6">
                  <div className="aspect-video bg-brand-secondary flex items-center justify-center relative">
                    {course.coverUrl ? (
                      <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                    ) : (
                      <PlayIcon className="w-16 h-16 text-brand-text-secondary/50" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <h2 className="text-2xl font-bold text-white text-center px-4">{activeModule.title}</h2>
                    </div>
                  </div>
                </Card>
              )}

              <div className="mb-8">
                <h1 className="text-3xl font-black text-brand-text-primary mb-2">{activeModule.title}</h1>
                <p className="text-brand-text-secondary text-lg mb-6">{activeModule.description}</p>
                
                <Card className="border-brand-border bg-brand-dark/30 mb-8">
                  <div className="prose prose-invert max-w-none prose-p:text-brand-text-secondary prose-headings:text-brand-text-primary">
                    <Markdown>{activeModule.content}</Markdown>
                  </div>
                </Card>

                <div className="flex justify-center">
                  <button
                    onClick={() => handleMarkComplete(activeModule.id)}
                    disabled={completedModules.includes(activeModule.id) || completing}
                    className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all ${
                      completedModules.includes(activeModule.id)
                        ? 'bg-green-900/30 text-green-400 border border-green-500/30 cursor-default' 
                        : 'bg-brand-accent text-white hover:bg-opacity-90 hover:scale-105 shadow-lg shadow-brand-accent/20'
                    }`}
                  >
                    {completedModules.includes(activeModule.id) ? (
                      <>
                        <CheckIcon className="w-6 h-6" />
                        Completed
                      </>
                    ) : completing ? (
                      'Saving...'
                    ) : (
                      <>
                        <CheckIcon className="w-6 h-6" />
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
              <h3 className="text-xl font-bold text-brand-text-primary mb-2">No modules available</h3>
              <p className="text-brand-text-secondary">
                This course doesn't have any content yet.
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar / Module List */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
            <h3 className="text-lg font-bold text-brand-text-primary mb-4">Course Content</h3>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-brand-text-secondary mb-2">
                <span>Progress</span>
                <span>{completedModules.length} / {modules.length}</span>
              </div>
              <div className="w-full bg-brand-secondary rounded-full h-2">
                <div 
                  className="bg-brand-accent h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${modules.length > 0 ? (completedModules.length / modules.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 mt-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {modules.map((module, index) => {
                const isCompleted = completedModules.includes(module.id);
                const isActive = activeModuleId === module.id;
                
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModuleId(module.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${
                      isActive 
                        ? 'bg-brand-accent/20 border border-brand-accent/30' 
                        : 'hover:bg-brand-secondary border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive
                          ? 'border-brand-accent text-brand-accent'
                          : 'border-brand-text-secondary/50 text-transparent'
                    }`}>
                      {isCompleted && <CheckIcon className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${isActive ? 'text-brand-accent' : 'text-brand-text-primary'}`}>
                        {index + 1}. {module.title}
                      </div>
                      <div className="text-xs text-brand-text-secondary mt-1 line-clamp-1">
                        {module.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
