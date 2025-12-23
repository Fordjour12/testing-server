import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowRight, Brain, Sparkles, Zap, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
   component: RouteComponent,
})

function RouteComponent() {
   return (
      <div className="min-h-screen bg-background relative overflow-hidden">
         {/* Background Elements */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2" />
         </div>

         {/* Navigation / Header */}
         <header className="container mx-auto px-4 py-6 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
               <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <Brain className="w-5 h-5" />
               </div>
               <span>PlanFlow</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
               <Link to="/" className="hover:text-primary transition-colors">Features</Link>
               <Link to="/" className="hover:text-primary transition-colors">Pricing</Link>
               <Link to="/" className="hover:text-primary transition-colors">About</Link>
            </nav>
            <div className="flex items-center gap-4">
               <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Sign In
               </Link>
               <Link to="/generate">
                  <Button size="sm" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                     Get Started
                  </Button>
               </Link>
            </div>
         </header>

         <main className="container mx-auto px-4 pt-12 pb-24 md:pt-24 md:pb-32 relative z-10">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center space-y-8 mb-24 md:mb-32">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
               >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border text-sm mb-6 backdrop-blur-sm shadow-sm">
                     <Sparkles className="w-3.5 h-3.5 text-primary" />
                     <span className="font-medium">New: Hybrid Architecture with Auto-Save</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-br from-foreground to-foreground/60 pb-2">
                     Plan your life at the <br />
                     <span className="text-primary">speed of thought.</span>
                  </h1>
               </motion.div>

               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
               >
                  Generate comprehensive monthly plans in seconds.
                  Our new hybrid engine ensures your ideas are captured instantly and never lost.
               </motion.p>

               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
               >
                  <Link to="/generate">
                     <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                        Start Planning Now
                        <ArrowRight className="ml-2 w-4 h-4" />
                     </Button>
                  </Link>
                  <Button
                     size="lg"
                     variant="outline"
                     className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-muted transition-colors"
                     onClick={() => {
                        document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
                        const video = document.getElementById('demo-video') as HTMLVideoElement
                        if (video) video.play()
                     }}
                  >
                     View Demo
                  </Button>
               </motion.div>
            </div>

            {/* Demo Video Section */}
            <motion.div
               id="demo-section"
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.7 }}
               className="max-w-5xl mx-auto mb-32"
            >
               <div className={cn(
                  "relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card/50 backdrop-blur-xl aspect-video group",
                  "after:absolute after:inset-0 after:bg-linear-to-t after:from-background/20 after:to-transparent after:pointer-events-none"
               )}>
                  <div className="absolute inset-0 grid place-items-center bg-muted/20">
                     {/* Placeholder / Mock Video */}
                     <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto backdrop-blur-sm animate-pulse">
                           <Zap className="w-8 h-8 fill-current" />
                        </div>
                        <p className="text-muted-foreground font-medium">Application Demo Preview</p>
                     </div>

                     {/* Actual Video Element (Commented out until asset is available) */}
                     {/* 
                     <video 
                        id="demo-video"
                        className="w-full h-full object-cover"
                        controls
                        poster="/demo-poster.png"
                     >
                        <source src="/demo-reel.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                     </video> 
                     */}
                  </div>

                  {/* Decorative UI Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                     <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                     </div>
                     <div className="px-3 py-1 rounded-full bg-black/10 backdrop-blur-md text-xs font-medium text-foreground/50 border border-white/10">
                        PlanFlow v2.0
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Feature Grid */}
            <motion.div
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.7 }}
               className="grid md:grid-cols-3 gap-8"
            >
               <FeatureCard
                  icon={<Zap className="w-6 h-6 text-primary" />}
                  title="Instant Generation"
                  description="Powered by advanced AI models to create detailed, actionable plans tailored to your life goals."
               />
               <FeatureCard
                  icon={<Shield className="w-6 h-6 text-primary" />}
                  title="Draft Recovery"
                  description="Never lose your progress. Our hybrid architecture auto-stages your work so you can resume exactly where you left off."
               />
               <FeatureCard
                  icon={<Clock className="w-6 h-6 text-primary" />}
                  title="Smart Scheduling"
                  description="Optimize your time with intelligent task distribution that respects your weekends and energy levels."
               />
            </motion.div>
         </main>
      </div>
   )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
   return (
      <div className="group p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
         <div className="w-12 h-12 rounded-xl bg-background border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-300 shadow-sm group-hover:border-primary/20">
            {icon}
         </div>
         <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
         <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
            {description}
         </p>
      </div>
   )
}
