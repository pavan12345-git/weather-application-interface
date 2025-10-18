export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-2">
            <h3 className="font-bold">WeatherHub</h3>
            <p className="text-sm text-muted-foreground">Real-time weather information at your fingertips</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Quick Links</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Follow Us</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>&copy; 2025 WeatherHub. All rights reserved.</p>
          <p>Weather data provided by weather services</p>
        </div>
      </div>
    </footer>
  )
}
