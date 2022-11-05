const init = async () => {
    if (!navigator.gpu) {
      console.error("navigator.gpu not found");
      return;
    }
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const canvas = document.getElementById("c");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device, format,
      alphaMode: "opaque"
    });
    
    const shaderModule = device.createShaderModule({
      code: `
        struct VertexOut {
          @builtin(position) position : vec4<f32>,
          @location(0) color : vec4<f32>,
        };
  
        @vertex
        fn vertexMain(@location(0) position: vec4<f32>,
                      @location(1) color: vec4<f32>) -> VertexOut
        {
          var output : VertexOut;
          output.position = position;
          output.color = color;
          return output;
        } 
  
        @fragment
        fn fragmentMain(fragData: VertexOut) -> @location(0) vec4<f32>
        {
          return fragData.color;
        } 
      `
    });
    
    const vertexBuffersDescriptors = [
      {
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x4"
          },
          {
            shaderLocation: 1,
            offset: 16,
            format: "float32x4"
          },
        ],
        arrayStride: 32,
        stepMode: "vertex"
      }
    ];
    
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
        buffers: vertexBuffersDescriptors
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format }]
      }
    });
    
    // vertex buffer
    // X Y Z W R G B A
    const vertexData = new Float32Array([
      -1, -1, 0, 1, 1, 0, 0, 1,
      0, 1, 0, 1, 0, 1, 0, 1,
      1, -1, 0, 1, 0, 0, 1, 1
    ]);
    const vertexBuffer = device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);
  
    // draw
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: [0.0, 0.0, 0.0, 1.0],
        loadOp: "clear",
        storeOp: "store"
      }]
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(3);
    
    passEncoder.end();
  
    device.queue.submit([commandEncoder.finish()]);
  };
  
  init();