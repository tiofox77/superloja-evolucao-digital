import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, CheckCircle, Shield, ArrowRight } from 'lucide-react';

interface Section {
  type: 'hero' | 'text' | 'cards' | 'features' | 'contact' | 'cta';
  title?: string;
  content?: string;
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  background?: string;
}

interface StaticPageLayoutProps {
  sections: Section[];
}

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ sections }) => {
  const getIcon = (iconName?: string) => {
    const icons: Record<string, React.ReactNode> = {
      'check': <CheckCircle className="w-6 h-6" />,
      'shield': <Shield className="w-6 h-6" />,
      'mail': <Mail className="w-6 h-6" />,
      'phone': <Phone className="w-6 h-6" />,
      'location': <MapPin className="w-6 h-6" />,
      'clock': <Clock className="w-6 h-6" />,
    };
    return icons[iconName || 'check'] || <CheckCircle className="w-6 h-6" />;
  };

  const renderSection = (section: Section, index: number) => {
    switch (section.type) {
      case 'hero':
        return (
          <section key={index} className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 hero-gradient opacity-10"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold text-foreground mb-6 animate-fade-in">
                  {section.title}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={index} className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {section.title && (
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {section.title}
                  </h2>
                )}
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'cards':
        return (
          <section key={index} className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
                  {section.title}
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.items?.map((item, itemIndex) => (
                  <Card key={itemIndex} className="product-card hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center text-primary-foreground">
                        {getIcon(item.icon)}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={index} className="py-16">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
                  {section.title}
                </h2>
              )}
              <div className="max-w-4xl mx-auto">
                {section.items?.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-4 mb-8 last:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center text-primary-foreground flex-shrink-0">
                      {getIcon(item.icon)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'contact':
        return (
          <section key={index} className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {section.items?.map((item, itemIndex) => (
                    <Card key={itemIndex} className="product-card">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center text-primary-foreground">
                            {getIcon(item.icon)}
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={index} className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient opacity-20"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-foreground mb-6">
                  {section.title}
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {section.content}
                </p>
                <Button size="lg" className="hover-scale">
                  <span className="mr-2">Entre em Contato</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-0">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  );
};