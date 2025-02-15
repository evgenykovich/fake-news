import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from './openai.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../monitoring/metrics.service';
import { mockArticle } from '../mocks/article.mocks';
import { mockMetricsService } from '../test/mocks/metrics.service.mock';

const mockCallFn = jest.fn();

jest.mock('langchain/llms/openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      call: mockCallFn,
    })),
  };
});

const mockOpenAI = jest.requireMock('langchain/llms/openai').OpenAI;

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCallFn.mockImplementation((prompt) => {
      if (prompt.includes('satirical news editor')) {
        return 'Mocked troll headline';
      }
      if (prompt.includes('categorization expert')) {
        return 'TECHNOLOGY';
      }
      return 'Unexpected prompt';
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-key';
              return undefined;
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
  });

  afterAll(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTrollTitle', () => {
    it('should generate a troll title successfully', async () => {
      const result = await service.generateTrollTitle(mockArticle);

      expect(result).toBe('Mocked troll headline');
      expect(mockOpenAI).toHaveBeenCalledWith({
        openAIApiKey: 'test-key',
        temperature: 0.7,
        modelName: 'gpt-3.5-turbo',
      });
    });

    it('should include the original title in the prompt', async () => {
      await service.generateTrollTitle(mockArticle);

      expect(mockCallFn).toHaveBeenCalled();
      const promptArg = mockCallFn.mock.calls[0][0];
      expect(promptArg).toContain(mockArticle.title);
      expect(promptArg).toContain('Original headline');
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockCallFn.mockRejectedValueOnce(new Error('OpenAI API Error'));

      await expect(service.generateTrollTitle(mockArticle)).rejects.toThrow(
        'Error generating fake news title: OpenAI API Error',
      );
    });

    it('should use correct model name', async () => {
      await service.generateTrollTitle(mockArticle);

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: 'gpt-3.5-turbo',
        }),
      );
    });

    it('should maintain consistent prompt template', async () => {
      await service.generateTrollTitle(mockArticle);

      const promptArg = mockCallFn.mock.calls[0][0];
      expect(promptArg).toContain('satirical news editor');
      expect(promptArg).toContain('funny, absurd, and opposite');
      expect(promptArg).toContain('avoid offensive content');
    });
  });
});
