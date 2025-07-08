import React from 'react';

interface BannerPreviewProps {
  bannerRef: React.RefObject<HTMLDivElement>;
  productData: {
    title: string;
    description: string;
    price: string;
    imageUrl: string;
    productUrl: string;
  };
  settings: {
    width: number;
    height: number;
    customBackground: string;
    customTextColor: string;
    priceEnabled: boolean;
    urlEnabled: boolean;
    produtoFundoBranco: boolean;
    selectedTemplate: string;
  };
  generateTemplateBackground: (templateKey: string) => string;
}

export const BannerPreview: React.FC<BannerPreviewProps> = ({
  bannerRef,
  productData,
  settings,
  generateTemplateBackground
}) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-100 flex items-center justify-center min-h-[400px]">
      <div 
        className="relative"
        style={{
          width: Math.min(500, settings.width * 0.8),
          height: Math.min(400, settings.height * 0.8),
          overflow: 'hidden'
        }}
      >
        <div
          ref={bannerRef}
          id="banner-element"
          style={{
            width: `${settings.width}px`,
            height: `${settings.height}px`,
            background: generateTemplateBackground(settings.selectedTemplate),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${Math.max(20, settings.height * 0.05)}px`,
            boxSizing: 'border-box',
            transform: `scale(${Math.min(500 / settings.width, 400 / settings.height)})`,
            transformOrigin: 'center center',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
        >
          {/* Container principal do conteúdo */}
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${Math.max(10, settings.height * 0.02)}px`,
            textAlign: 'center'
          }}>
            
            {/* Imagem do Produto */}
            {productData.imageUrl && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: `${Math.max(5, settings.height * 0.01)}px`,
                flex: '0 0 auto'
              }}>
                <div 
                  style={{
                    backgroundColor: settings.produtoFundoBranco ? '#ffffff' : 'transparent',
                    padding: settings.produtoFundoBranco ? `${Math.max(8, settings.width * 0.01)}px` : '0',
                    borderRadius: settings.produtoFundoBranco ? `${Math.max(6, settings.width * 0.008)}px` : '0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: settings.produtoFundoBranco ? `0 ${Math.max(2, settings.height * 0.006)}px ${Math.max(8, settings.height * 0.015)}px rgba(0,0,0,0.15)` : 'none'
                  }}
                >
                  <img 
                    src={productData.imageUrl} 
                    alt={productData.title}
                    style={{ 
                      maxHeight: `${Math.min(200, settings.height * 0.3)}px`,
                      maxWidth: `${Math.min(200, settings.width * 0.3)}px`,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Container de textos */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center',
              gap: `${Math.max(5, settings.height * 0.008)}px`,
              maxWidth: '90%',
              flex: '1 1 auto'
            }}>
              
              {/* Título */}
              <h1 
                style={{ 
                  color: settings.customTextColor,
                  fontSize: `${Math.max(16, Math.min(settings.height * 0.08, settings.width * 0.05))}px`,
                  fontWeight: 'bold',
                  margin: 0,
                  lineHeight: 1.2,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  wordWrap: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {productData.title}
              </h1>
              
              {/* Descrição */}
              {productData.description && (
                <p 
                  style={{ 
                    color: settings.customTextColor,
                    fontSize: `${Math.max(12, Math.min(settings.height * 0.04, settings.width * 0.03))}px`,
                    margin: 0,
                    lineHeight: 1.3,
                    opacity: 0.9,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                    wordWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {productData.description}
                </p>
              )}
              
              {/* Preço */}
              {settings.priceEnabled && productData.price && (
                <div 
                  style={{ 
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    padding: `${Math.max(4, settings.height * 0.008)}px ${Math.max(8, settings.width * 0.02)}px`,
                    borderRadius: `${Math.max(4, settings.width * 0.01)}px`,
                    marginTop: `${Math.max(5, settings.height * 0.01)}px`
                  }}
                >
                  <p 
                    style={{ 
                      color: settings.customTextColor,
                      fontSize: `${Math.max(14, Math.min(settings.height * 0.05, settings.width * 0.035))}px`,
                      fontWeight: 'bold',
                      margin: 0,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
                    }}
                  >
                    AOA {Number(productData.price).toLocaleString('pt-AO')}
                  </p>
                </div>
              )}
              
              {/* URL */}
              {settings.urlEnabled && (
                <p 
                  style={{ 
                    color: settings.customTextColor,
                    fontSize: `${Math.max(10, Math.min(settings.height * 0.03, settings.width * 0.02))}px`,
                    margin: 0,
                    opacity: 0.8,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    marginTop: `${Math.max(5, settings.height * 0.01)}px`
                  }}
                >
                  {productData.productUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
        Preview em escala reduzida
      </div>
    </div>
  );
};