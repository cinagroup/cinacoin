require "json"

package = JSON.parse(File.read(File.join(__dir__, "../package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "CinacoinReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/cinacoin/cinacoin-sdk"
  s.license      = package["license"]
  s.authors      = { "Cinacoin" => "dev@cinacoin.io" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/cinacoin/cinacoin-sdk.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # Fabric / New Architecture support
  install_modules_dependencies(s)

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }

    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  else
    s.dependency "React-Core"
  end
end
